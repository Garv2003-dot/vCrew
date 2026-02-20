import type { Employee, Project, AllocationProposal, ProjectDemand } from '@repo/types';
import type { AgentContext } from './types';

/** Build minimal context for orchestrator decision-making */
export function buildDecisionContext(ctx: AgentContext): string {
  const parts: string[] = [];

  // Only last 3 conversation messages
  const recentMessages = ctx.conversation.slice(-3);
  if (recentMessages.length > 0) {
    parts.push('=== RECENT CONVERSATION ===');
    recentMessages.forEach((m) => {
      parts.push(`${m.role.toUpperCase()}: ${m.content}`);
    });
  }

  // Minimal demand info
  if (ctx.demand && Object.keys(ctx.demand).length > 0) {
    parts.push('\n=== DEMAND ===');
    parts.push(JSON.stringify(ctx.demand));
  }

  if (ctx.loadingDemand) {
    parts.push('\n=== LOADING DEMAND ===');
    parts.push(JSON.stringify(ctx.loadingDemand));
  }

  if (ctx.currentProposal) {
    parts.push('\n=== CURRENT PROPOSAL ===');
    parts.push(`Project: ${ctx.currentProposal.projectName}, Roles: ${ctx.currentProposal.roleAllocations?.length || 0}`);
  }

  return parts.join('\n');
}

/** Build compact context for allocation (no conversation history) */
export function buildAllocationContext(ctx: AgentContext): string {
  const parts: string[] = [];

  // Compact employee format: Name | Role | Availability%
  parts.push('=== EMPLOYEES ===');
  ctx.employees.forEach((e) => {
    const avail = e.availabilityPercent ?? 100;
    parts.push(`${e.name} | ${e.role} | ${avail}%`);
  });

  // Only include relevant project if existing_project
  if (ctx.inputType === 'existing_project' && ctx.demand?.projectId) {
    const project = ctx.projects.find((p) => p.id === ctx.demand?.projectId);
    if (project) {
      parts.push('\n=== PROJECT ===');
      parts.push(`Name: ${project.name}, Status: ${project.status}`);
    }
  }

  // Compact demand (no pretty formatting)
  if (ctx.demand && Object.keys(ctx.demand).length > 0) {
    parts.push('\n=== DEMAND ===');
    parts.push(JSON.stringify(ctx.demand));
  }

  return parts.join('\n');
}

/** Build context for analysis agents */
export function buildAnalysisContext(ctx: AgentContext): string {
  const parts: string[] = [];

  // Compact employee format
  parts.push('=== EMPLOYEES ===');
  ctx.employees.forEach((e) => {
    const avail = e.availabilityPercent ?? 100;
    const skills = e.skills?.map((s) => s.name).join(', ') || 'none';
    parts.push(`${e.name} | ${e.role} | ${avail}% | Skills: ${skills}`);
  });

  if (ctx.currentProposal) {
    parts.push('\n=== CURRENT ALLOCATION ===');
    ctx.currentProposal.roleAllocations?.forEach((r) => {
      const recs = r.recommendations.map((rec) => rec.employeeName).join(', ');
      parts.push(`${r.roleName}: ${recs}`);
    });
  }

  if (ctx.demand && Object.keys(ctx.demand).length > 0) {
    parts.push('\n=== DEMAND ===');
    parts.push(JSON.stringify(ctx.demand));
  }

  return parts.join('\n');
}

/** Build full context string (legacy - use specific builders instead) */
export function buildFullContextString(ctx: AgentContext): string {
  // For backward compatibility, delegate to decision context
  // But this should be phased out in favor of specific builders
  return buildDecisionContext(ctx);
}
