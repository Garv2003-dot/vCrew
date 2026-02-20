import { Router } from 'express';
import { ProjectDemand, LoadingDemand, LoadingRow } from '@repo/types';
import { generateAllocation, processAgentInstruction } from '../ai';
import { runMainOrchestrator } from '../ai/agents/mainOrchestrator';
import { fetchEmployeesFromSupabase } from '../services/employeesService';
import { fetchProjectsFromSupabase } from '../services/projectsService';
import { ensureDemandRoles } from '../utils/parseResourceDescription';

export const allocationRoutes = Router();

async function getAllocationData() {
  const [employees, projects] = await Promise.all([
    fetchEmployeesFromSupabase(),
    fetchProjectsFromSupabase(),
  ]);
  return { employees, projects };
}

/** Convert LoadingDemand to ProjectDemand. intervalAllocations: 100=1 FTE, 200=2 FTE per week */
function loadingToProjectDemand(loading: LoadingDemand): ProjectDemand {
  const roles = loading.rows.map((row: LoadingRow) => {
    const values = Object.values(row.intervalAllocations || {}) as number[];
    const maxInAnyWeek = values.length ? Math.max(...values) : 100;
    const headcount = Math.max(1, Math.ceil(maxInAnyWeek / 100));
    return {
      roleName: row.roleName,
      requiredSkills: (row.primarySkills || []).map((name: string, i: number) => ({
        skillId: `s-${i}`,
        name,
        minimumProficiency: 3 as 1 | 2 | 3 | 4 | 5,
      })),
      experienceLevel: row.experienceLevel,
      allocationPercent: 100,
      headcount,
    };
  });

  return {
    demandId: loading.demandId,
    projectType: 'NEW',
    projectName: loading.projectName,
    priority: loading.priority,
    startDate: loading.startDate,
    durationMonths: loading.durationMonths,
    context: loading.context,
    roles,
  };
}

allocationRoutes.post('/demand', async (req, res) => {
  console.log('[API] /demand hit');
  try {
    const demand: ProjectDemand = req.body;
    let normalizedDemand = ensureDemandRoles(demand);

    console.log('[API] /demand: fetching employees, projects...');
    const { employees, projects } = await getAllocationData();
    console.log('[API] /demand: got', employees?.length, 'employees,', projects?.length, 'projects');

    // When form has only context/resourceDescription (no explicit roles), parse via AI
    if (!normalizedDemand.roles?.length && (normalizedDemand.context || normalizedDemand.resourceDescription)) {
      console.log('[API] /demand: no roles, parsing context via chatDemandAgent');
      const { parseChatDemand } = await import('../ai/agents/demand/chatDemandAgent');
      const ctx = {
        employees,
        projects,
        currentProposal: null,
        demand: normalizedDemand,
        loadingDemand: null,
        conversation: [],
        userInput: normalizedDemand.context || normalizedDemand.resourceDescription || '',
      };
      const result = await parseChatDemand(ctx);
      normalizedDemand = result.demand;
    }

    if (!normalizedDemand.roles?.length) {
      return res.status(400).json({
        error: 'No roles in demand. Add roles in the form or provide a resource description (e.g. "2 Backend, 1 PM, 2 QA").',
      });
    }

    console.log('[API] /demand: calling generateAllocation for', normalizedDemand.roles.length, 'roles...');
    const proposal = await generateAllocation(
      normalizedDemand,
      employees,
      projects,
    );

    console.log('[API] /demand: done, returning proposal');
    res.json(proposal);
  } catch (err) {
    console.error('[API] /demand error:', err);
    res.status(500).json({
      error: `Failed to generate allocation: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

allocationRoutes.post('/loading-demand', async (req, res) => {
  try {
    const loading: LoadingDemand = req.body;
    const demand = loadingToProjectDemand(loading);
    const { employees, projects } = await getAllocationData();

    const proposal = await generateAllocation(demand, employees, projects);

    // Enrich each recommendation with interval (week) allocation from loading table
    const intervalLabel = loading.intervalLabel || 'Week';
    const enrichedRoleAllocations = proposal.roleAllocations?.map((roleAlloc) => {
      const loadingRow = loading.rows.find(
        (r) => r.roleName.toLowerCase() === roleAlloc.roleName.toLowerCase(),
      );
      const intervals = loadingRow?.intervalAllocations || {};
      const recCount = roleAlloc.recommendations.length;
      const perPerson: Record<number, number> = {};
      Object.entries(intervals).forEach(([idxStr, pct]) => {
        const idx = Number(idxStr);
        if (!Number.isNaN(idx) && pct > 0) {
          perPerson[idx] = Math.round(pct / recCount);
        }
      });

      return {
        ...roleAlloc,
        recommendations: roleAlloc.recommendations.map((rec) => ({
          ...rec,
          allocationIntervals: Object.keys(perPerson).length ? perPerson : undefined,
        })),
      };
    }) ?? [];

    res.json({
      ...proposal,
      roleAllocations: enrichedRoleAllocations,
      loadingContext: loading,
      intervalLabel,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: `Failed to generate allocation: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

allocationRoutes.post('/instruction', async (req, res) => {
  console.log('[API] /instruction hit');
  try {
    const { message, currentProposal, demand, conversation } = req.body;

    // Safety check
    if (!message || !demand) {
      return res
        .status(400)
        .json({ error: 'Missing message or original demand' });
    }

    const { employees, projects } = await getAllocationData();

    const result = await processAgentInstruction(
      message,
      employees,
      currentProposal || null,
      demand,
      conversation || [],
      projects,
    );

    res.json(result);
  } catch (err: any) {
    console.error('Agent instruction failed', err);
    res.status(500).json({
      error: err.message || 'Failed to process instruction',
    });
  }
});

/** Agentic endpoint: full orchestration with thinking steps, handles all input types */
allocationRoutes.post('/agentic', async (req, res) => {
  console.log('[API] /agentic hit');
  try {
    const {
      message,
      demand,
      loadingDemand,
      currentProposal,
      conversation = [],
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    console.log('[API] Fetching employees and projects...');
    const { employees, projects } = await getAllocationData();
    console.log('[API] Got', employees?.length ?? 0, 'employees,', projects?.length ?? 0, 'projects');

    const result = await runMainOrchestrator(
      {
        userInput: message,
        demand: demand || null,
        loadingDemand: loadingDemand || null,
        currentProposal: currentProposal || null,
        conversation,
        employees,
        projects,
      },
      (step) => {
        console.log(`[Agent] ${step.agent}: ${step.message}`);
      }
    );

    res.json(result);
  } catch (err: any) {
    console.error('Agentic orchestration failed', err);
    res.status(500).json({
      error: err?.message || 'Failed to process agentic request',
    });
  }
});

/** Agentic stream: SSE for real-time thinking steps */
allocationRoutes.post('/agentic/stream', async (req, res) => {
  console.log('[API] /agentic/stream hit');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as any).flush === 'function') (res as any).flush();
  };

  try {
    const {
      message,
      demand,
      loadingDemand,
      currentProposal,
      conversation = [],
    } = req.body;

    if (!message) {
      send('error', { error: 'Missing message' });
      res.end();
      return;
    }

    console.log('[API] Fetching employees and projects (stream)...');
    const { employees, projects } = await getAllocationData();
    console.log('[API] Got', employees?.length ?? 0, 'employees,', projects?.length ?? 0, 'projects');

    const result = await runMainOrchestrator(
      {
        userInput: message,
        demand: demand || null,
        loadingDemand: loadingDemand || null,
        currentProposal: currentProposal || null,
        conversation,
        employees,
        projects,
      },
      (step) => {
        send('thinking', { agent: step.agent, step: step.step, message: step.message });
      }
    );

    send('result', result);
  } catch (err: any) {
    send('error', { error: err?.message || 'Agentic orchestration failed' });
  } finally {
    res.end();
  }
});
