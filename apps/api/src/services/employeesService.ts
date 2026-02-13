import { Employee } from '@repo/types';
import { supabase } from '../lib/supabase';

export async function fetchEmployeesFromSupabase(): Promise<Employee[]> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (empError) throw empError;
  if (!employees?.length) return [];

  const ids = employees.map((e: any) => e.id);

  const [skillsRes, experiencesRes, assignmentsRes] = await Promise.all([
    supabase
      .from('employee_skills')
      .select('employee_id, skill_id, proficiency, skills(id, name)')
      .in('employee_id', ids),
    supabase.from('work_experiences').select('*').in('employee_id', ids),
    supabase
      .from('project_assignments')
      .select(
        'project_id, employee_id, role_name, allocation_percent, projects(id, name, logo)',
      )
      .in('employee_id', ids)
      .eq('status', 'ACTIVE'),
  ]);

  const skillsMap = new Map<
    string,
    { skillId: string; name: string; proficiency: 1 | 2 | 3 | 4 | 5 }[]
  >();
  for (const row of skillsRes.data || []) {
    const empId = row.employee_id as string;
    if (!skillsMap.has(empId)) skillsMap.set(empId, []);
    const skill = (row as any).skills;
    if (skill) {
      skillsMap.get(empId)!.push({
        skillId: skill.id,
        name: skill.name,
        proficiency: (row.proficiency as 1 | 2 | 3 | 4 | 5) || 3,
      });
    }
  }

  const expMap = new Map<
    string,
    {
      companyName: string;
      companyUrl: string;
      jobTitle: string;
      startDate: string;
      endDate: string;
    }[]
  >();
  for (const row of experiencesRes.data || []) {
    const empId = row.employee_id as string;
    if (!expMap.has(empId)) expMap.set(empId, []);
    expMap.get(empId)!.push({
      companyName: row.company_name,
      companyUrl: row.company_url || '',
      jobTitle: row.job_title,
      startDate: row.start_date,
      endDate: row.end_date,
    });
  }

  const assignMap = new Map<
    string,
    {
      projectId: string;
      allocationPercent: number;
      roleName: string;
      projectName?: string;
      projectLogo?: string;
    }[]
  >();
  for (const row of assignmentsRes.data || []) {
    const empId = row.employee_id as string;
    const proj = (row as any).projects;
    if (!assignMap.has(empId)) assignMap.set(empId, []);
    assignMap.get(empId)!.push({
      projectId: row.project_id,
      allocationPercent: row.allocation_percent,
      roleName: row.role_name,
      projectName: proj?.name,
      projectLogo: proj?.logo,
    });
  }

  return employees.map((e: any) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    experienceLevel: e.experience_level as 'JUNIOR' | 'MID' | 'SENIOR',
    age: e.age ?? undefined,
    gender: e.gender ?? '',
    mobile: e.mobile ?? '',
    email: e.email ?? '',
    address: e.address ?? '',
    state: e.state ?? '',
    pincode: e.pincode ?? '',
    description: e.description ?? '',
    workExperience: expMap.get(e.id) || [],
    skills: skillsMap.get(e.id) || [],
    availabilityPercent: e.availability_percent ?? 100,
    status: e.status as Employee['status'],
    currentProjects: assignMap.get(e.id) || [],
  }));
}
