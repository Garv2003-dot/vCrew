import { Router, Request, Response } from 'express';
import { fetchEmployeesFromSupabase } from '../services/employeesService';
import { supabase } from '../lib/supabase';
import { getCanonicalRoleList } from '../utils/roleCanonical';

export const metadataRoutes = Router();

/** GET /api/metadata/roles – canonical (merged) roles for dropdowns; no duplicates like "Front End Developer" vs "FE Engineer" */
metadataRoutes.get('/roles', async (req: Request, res: Response) => {
  try {
    const employees = await fetchEmployeesFromSupabase();
    const rawRoles = [...new Set(employees.map((e) => e.role).filter(Boolean))];
    const roles = getCanonicalRoleList(rawRoles);
    const jobTitles = [...new Set(employees.map((e) => (e as any).jobTitle).filter(Boolean))].sort();
    res.json({ roles, job_titles: jobTitles });
  } catch (err) {
    console.error('Failed to fetch metadata roles', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch metadata',
    });
  }
});

/** GET /api/metadata/skills – distinct skills from DB */
metadataRoutes.get('/skills', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.json({ skills: [] });
    }
    const { data, error } = await supabase.from('skills').select('name').order('name');
    if (error) throw error;
    const skills = [...new Set((data || []).map((r: any) => r.name).filter(Boolean))];
    res.json({ skills });
  } catch (err) {
    console.error('Failed to fetch metadata skills', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch skills',
    });
  }
});

/** GET /api/metadata – canonical (merged) roles, job_titles, skills in one call */
metadataRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await fetchEmployeesFromSupabase();
    const rawRoles = [...new Set(employees.map((e) => e.role).filter(Boolean))];
    const roles = getCanonicalRoleList(rawRoles);
    const jobTitles = [...new Set(employees.map((e) => (e as any).jobTitle).filter(Boolean))].sort();
    let skills: string[] = [];
    if (supabase) {
      const { data } = await supabase.from('skills').select('name').order('name');
      skills = [...new Set((data || []).map((r: any) => r.name).filter(Boolean))];
    }
    res.json({ roles, job_titles: jobTitles, skills });
  } catch (err) {
    console.error('Failed to fetch metadata', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch metadata',
    });
  }
});
