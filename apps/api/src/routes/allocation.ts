import { Router } from 'express';
import { ProjectDemand } from '@repo/types';
import { generateAllocation, processAgentInstruction } from '@repo/ai-service';
import { mockEmployees } from '../data/mockEmployees';

export const allocationRoutes = Router();

allocationRoutes.post('/demand', async (req, res) => {
  try {
    const demand: ProjectDemand = req.body;

    const proposal = await generateAllocation(demand, mockEmployees);

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

    const result = await processAgentInstruction(
      message,
      mockEmployees,
      currentProposal || null,
      demand,
      conversation || [],
    );

    res.json(result);
  } catch (err: any) {
    console.error('Agent instruction failed', err);
    res.status(500).json({
      error: err.message || 'Failed to process instruction',
    });
  }
});
