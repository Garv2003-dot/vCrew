import { Router, Request, Response } from 'express';
import { fetchProjectsFromSupabase } from '../services/projectsService';

export const projectRoutes = Router();

projectRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await fetchProjectsFromSupabase();
    res.json(projects);
  } catch (err) {
    console.error('Failed to fetch projects', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch projects',
    });
  }
});
