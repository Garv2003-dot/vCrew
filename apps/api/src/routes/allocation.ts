import { Router } from 'express';
import { ProjectDemand } from '@repo/types';
import { generateAllocation, processAgentInstruction } from '@repo/ai-service';
import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';
import { ensureDemandRoles } from '../utils/parseResourceDescription';

export const allocationRoutes = Router();

allocationRoutes.post('/demand', async (req, res) => {
  try {
    const demand: ProjectDemand = req.body;
    const normalizedDemand = ensureDemandRoles(demand);

    const projects = mockProjects.map((p) => ({
      id: p.projectId,
      name: p.projectName,
      description: `Client: ${p.client}`,
      startDate: p.startDate,
      durationMonths: 6, // Approximate or calculate
      status: p.status as 'PLANNED' | 'ACTIVE' | 'COMPLETED',
      assignedEmployees: p.assignedEmployees,
    }));

    const proposal = await generateAllocation(normalizedDemand, mockEmployees, projects);

    res.json(proposal);
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

    const projects = mockProjects.map((p) => ({
      id: p.projectId,
      name: p.projectName,
      description: `Client: ${p.client}`,
      startDate: p.startDate,
      durationMonths: 6,
      status: p.status as 'PLANNED' | 'ACTIVE' | 'COMPLETED',
      assignedEmployees: p.assignedEmployees,
    }));

    const result = await processAgentInstruction(
      message,
      mockEmployees,
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
