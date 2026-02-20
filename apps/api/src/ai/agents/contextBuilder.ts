import type { Employee, Project, AllocationProposal, ProjectDemand } from '@repo/types';
import type { AgentContext } from './types';

/** Build a compact but complete context string for prompts - ALL agents see ALL data */
export function buildFullContextString(ctx: AgentContext): string {
  const parts: string[] = [];

  parts.push('=== EMPLOYEES ===');
  ctx.employees.forEach((e) => {
    const skills = e.skills?.map((s) => `${s.name}:${s.proficiency}`).join(', ') || 'none';
    const avail = e.availabilityPercent ?? 100;
    const projs = e.currentProjects?.map((p) => `${p.roleName}@${p.allocationPercent}%`).join('; ') || 'none';
    parts.push(`- ${e.name} (${e.role}, ${e.experienceLevel}, ${avail}% avail): Skills [${skills}] | Current: [${projs}]`);
  });

  parts.push('\n=== PROJECTS ===');
  ctx.projects.forEach((p) => {
    const assigned = p.assignedEmployees?.map((a) => `${a.roleName}:${a.allocationPercent}%`).join(', ') || 'none';
    parts.push(`- ${p.name} (${p.status}): ${assigned}`);
  });

  if (ctx.currentProposal) {
    parts.push('\n=== CURRENT ALLOCATION PROPOSAL ===');
    ctx.currentProposal.roleAllocations?.forEach((r) => {
      const recs = r.recommendations.map((rec) => `${rec.employeeName} (${rec.confidence})`).join(', ');
      parts.push(`- ${r.roleName}: ${recs}`);
    });
  }

  if (ctx.demand && Object.keys(ctx.demand).length > 0) {
    parts.push('\n=== CURRENT DEMAND ===');
    parts.push(JSON.stringify(ctx.demand, null, 2));
  }

  if (ctx.loadingDemand) {
    parts.push('\n=== LOADING TABLE DEMAND ===');
    parts.push(JSON.stringify(ctx.loadingDemand, null, 2));
  }

  parts.push('\n=== CONVERSATION HISTORY ===');
  ctx.conversation.forEach((m) => {
    parts.push(`${m.role.toUpperCase()}: ${m.content}`);
  });

  return parts.join('\n');
}
