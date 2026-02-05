export interface Employee {
  id: string;
  name: string;
  role: string;
  experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR';

  skills: {
    skillId: string;
    name: string;
    proficiency: 1 | 2 | 3 | 4 | 5;
  }[];

  availabilityPercent: number;

  status: 'ALLOCATED' | 'PARTIAL' | 'BENCH' | 'SHADOW';

  currentProjects: {
    projectId: string;
    allocationPercent: number;
  }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  durationMonths: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
}

export interface AllocationProposal {
  projectName: string;

  roleAllocations: {
    roleName: string;
    recommendations: {
      employeeId: string;
      employeeName: string;
      confidence: number;
      reason: string;
    }[];
  }[];

  generatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface ProjectDemand {
  demandId: string;
  projectType: 'NEW' | 'EXISTING';
  projectId?: string; // For existing projects

  // Role details flattened/expanded as per new requirements
  role: string;
  primarySkills: string[];
  secondarySkills: string[];
  techStack: string[];

  projectName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  durationMonths: number;
  probabilityOfConversion?: number;

  roles: {
    roleName: string;
    requiredSkills: {
      skillId: string;
      name: string;
      minimumProficiency: 1 | 2 | 3 | 4 | 5;
    }[];
    experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR';
    allocationPercent: number;
    headcount: number;
  }[];
}

export interface AgentMemoryEntry {
  id: string; // uuid
  timestamp: string;

  userMessage: string;

  intent: {
    intentType: string;
    role?: string | string[] | null;
    skills?: string[] | null;
    employeeCount?: number | null;
  };

  changeSummary: string;

  beforeProposal: AllocationProposal;
  afterProposal: AllocationProposal;
}

export interface AgentConversationContext {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  lastIntent?: any; // Avoiding circular dependency for now, or use AllocationIntent if moved to shared types
  lastAction?: string;
}
