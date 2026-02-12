import { Router } from 'express';
import { ProjectDemand, LoadingDemand } from '@repo/types';
import { generateAllocation, processAgentInstruction } from '@repo/ai-service';
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

/** Convert LoadingDemand to ProjectDemand (aggregate by role for AI; per-interval AI can be extended later) */
function loadingToProjectDemand(loading: LoadingDemand): ProjectDemand {
  const roles = loading.rows.map((row) => {
    const headcount = Math.max(1, ...Object.values(row.intervalAllocations));
    return {
      roleName: row.roleName,
      requiredSkills: (row.primarySkills || []).map((name, i) => ({
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
  try {
    const demand: ProjectDemand = req.body;
    const normalizedDemand = ensureDemandRoles(demand);
    const { employees, projects } = await getAllocationData();

    const proposal = await generateAllocation(
      normalizedDemand,
      employees,
      projects,
    );

    res.json(proposal);
  } catch (err) {
    console.error(err);
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
    res.json({ ...proposal, loadingContext: loading });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: `Failed to generate allocation: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

allocationRoutes.post('/instruction', async (req, res) => {
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
