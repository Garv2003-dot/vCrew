import { Project } from '@repo/types';
import { supabase } from '../lib/supabase';

export async function fetchProjectsFromSupabase(): Promise<Project[]> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('*')
    .order('name');

  if (projError) throw projError;
  if (!projects?.length) return [];

  const ids = projects.map((p) => p.id);

  const { data: assignments } = await supabase
    .from('project_assignments')
    .select('project_id, employee_id, role_name, allocation_percent')
    .in('project_id', ids)
    .eq('status', 'ACTIVE');

  const assignMap = new Map<
    string,
    { employeeId: string; allocationPercent: number; roleName: string }[]
  >();
  for (const row of assignments || []) {
    const projId = row.project_id as string;
    if (!assignMap.has(projId)) assignMap.set(projId, []);
    assignMap.get(projId)!.push({
      employeeId: row.employee_id,
      allocationPercent: row.allocation_percent,
      roleName: row.role_name,
    });
  }

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    startDate: p.start_date,
    durationMonths: p.duration_months ?? 3,
    status: p.status as 'PLANNED' | 'ACTIVE' | 'COMPLETED',
    assignedEmployees: assignMap.get(p.id) || [],
  }));
}
