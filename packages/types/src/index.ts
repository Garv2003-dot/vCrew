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

  status: 'ALLOCATED' | 'PARTIAL' | 'BENCH' | 'SHADOW' | 'ON_LEAVE'; // Added ON_LEAVE for consistency

  currentProjects: {
    projectId: string;
    allocationPercent: number;
    roleName: string; // Added roleName for better tracking
  }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  durationMonths: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  assignedEmployees: {
    employeeId: string;
    allocationPercent: number;
    roleName: string; // Added roleName
  }[];
}

export interface AllocationProposal {
  projectName: string;
  projectId?: string; // Optional context
  type: 'NEW' | 'EXISTING'; // Context

  roleAllocations: {
    roleName: string;
    recommendations: {
      employeeId: string;
      employeeName: string;
      currentRole: string;
      confidence: number;
      reason: string;
      status: 'EXISTING' | 'NEW' | 'REMOVED'; // Track change status
      allocationPercent: number; // Support partial allocation
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
  projectId?: string;

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
  id: string;
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

export interface DemandChangeLog {
  timestamp: string;
  source: 'FORM' | 'CHAT' | 'AGENT';
  delta: {
    roleName: string;
    headcountChange: number;
    reason?: string;
  };
}

export interface CanonicalProjectDemand extends ProjectDemand {
  // Enforce rigid structure if needed, or just alias for clarity of intent
  isCanonical: true;
  changeLog: DemandChangeLog[];
}

export interface AgentConversationContext {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  lastIntent?: any;
  lastAction?: string;
}
