import { Employee } from '@repo/types';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    role: 'Senior Frontend Dev',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's1', name: 'React', proficiency: 5 },
      { skillId: 's2', name: 'TypeScript', proficiency: 5 },
      { skillId: 's3', name: 'Tailwind', proficiency: 4 },
    ],
    availabilityPercent: 0,
    status: 'ALLOCATED',
    currentProjects: [
      {
        projectId: 'proj-002',
        allocationPercent: 100,
        roleName: 'Senior Frontend Dev',
      },
    ],
  },

  {
    id: '2',
    name: 'Bob Smith',
    role: 'Backend Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's4', name: 'Node.js', proficiency: 4 },
      { skillId: 's5', name: 'PostgreSQL', proficiency: 3 },
      { skillId: 's6', name: 'AWS', proficiency: 3 },
    ],
    availabilityPercent: 0,
    status: 'ALLOCATED',
    currentProjects: [
      {
        projectId: 'proj-001',
        allocationPercent: 100,
        roleName: 'Backend Engineer',
      },
    ],
  },

  {
    id: '3',
    name: 'Charlie Davis',
    role: 'Product Manager',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's7', name: 'Agile', proficiency: 5 },
      { skillId: 's8', name: 'Jira', proficiency: 4 },
    ],
    availabilityPercent: 40,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-001',
        allocationPercent: 60,
        roleName: 'Product Manager',
      },
    ],
  },

  {
    id: '4',
    name: 'Diana Prince',
    role: 'UX Designer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's9', name: 'Figma', proficiency: 5 },
      { skillId: 's10', name: 'Prototyping', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '5',
    name: 'Ethan Hunt',
    role: 'DevOps Engineer',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's11', name: 'Kubernetes', proficiency: 5 },
      { skillId: 's12', name: 'Docker', proficiency: 5 },
      { skillId: 's13', name: 'CI/CD', proficiency: 5 },
    ],
    availabilityPercent: 20,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-003',
        allocationPercent: 80,
        roleName: 'DevOps Engineer',
      },
    ],
  },

  {
    id: '6',
    name: 'Fiona Patel',
    role: 'Senior Frontend Dev',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's1', name: 'React', proficiency: 4 },
      { skillId: 's2', name: 'TypeScript', proficiency: 4 },
      { skillId: 's3', name: 'Tailwind', proficiency: 3 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '7',
    name: 'George Miller',
    role: 'Backend Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's4', name: 'Node.js', proficiency: 4 },
      { skillId: 's5', name: 'PostgreSQL', proficiency: 4 },
    ],
    availabilityPercent: 30,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-001',
        allocationPercent: 70,
        roleName: 'Backend Engineer',
      },
    ],
  },

  {
    id: '8',
    name: 'Hannah Lee',
    role: 'UX Designer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's9', name: 'Figma', proficiency: 5 },
      { skillId: 's10', name: 'Prototyping', proficiency: 5 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '9',
    name: 'Ivan Rodriguez',
    role: 'DevOps Engineer',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's11', name: 'Kubernetes', proficiency: 4 },
      { skillId: 's12', name: 'Docker', proficiency: 5 },
      { skillId: 's13', name: 'CI/CD', proficiency: 4 },
    ],
    availabilityPercent: 0,
    status: 'ALLOCATED',
    currentProjects: [
      {
        projectId: 'proj-003',
        allocationPercent: 100,
        roleName: 'DevOps Engineer',
      },
    ],
  },

  {
    id: '10',
    name: 'Julia Nguyen',
    role: 'Product Manager',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's7', name: 'Agile', proficiency: 5 },
      { skillId: 's8', name: 'Jira', proficiency: 5 },
    ],
    availabilityPercent: 40,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-002',
        allocationPercent: 60,
        roleName: 'Product Manager',
      },
    ],
  },

  {
    id: '11',
    name: 'Kevin Brown',
    role: 'Backend Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's4', name: 'Node.js', proficiency: 3 },
      { skillId: 's5', name: 'PostgreSQL', proficiency: 3 },
      { skillId: 's6', name: 'AWS', proficiency: 3 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '12',
    name: 'Laura Wilson',
    role: 'Senior Frontend Dev',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's1', name: 'React', proficiency: 5 },
      { skillId: 's2', name: 'TypeScript', proficiency: 4 },
      { skillId: 's3', name: 'Tailwind', proficiency: 4 },
    ],
    availabilityPercent: 10,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-002',
        allocationPercent: 90,
        roleName: 'Senior Frontend Dev',
      },
    ],
  },

  {
    id: '13',
    name: 'Michael Scott',
    role: 'Product Manager',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's7', name: 'Agile', proficiency: 4 },
      { skillId: 's8', name: 'Jira', proficiency: 3 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '14',
    name: 'Nina Kapoor',
    role: 'UX Designer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's9', name: 'Figma', proficiency: 4 },
      { skillId: 's10', name: 'Prototyping', proficiency: 4 },
    ],
    availabilityPercent: 60,
    status: 'PARTIAL',
    currentProjects: [
      { projectId: 'proj-001', allocationPercent: 40, roleName: 'UX Designer' },
    ],
  },

  {
    id: '15',
    name: 'Oscar Chen',
    role: 'DevOps Engineer',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's11', name: 'Kubernetes', proficiency: 5 },
      { skillId: 's12', name: 'Docker', proficiency: 4 },
      { skillId: 's13', name: 'CI/CD', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '16',
    name: 'Rahul Mehta',
    role: 'Backend Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's4', name: 'Node.js', proficiency: 4 },
      { skillId: 's5', name: 'PostgreSQL', proficiency: 4 },
      { skillId: 's6', name: 'AWS', proficiency: 3 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '17',
    name: 'Sneha Iyer',
    role: 'Senior Frontend Dev',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's1', name: 'React', proficiency: 5 },
      { skillId: 's2', name: 'TypeScript', proficiency: 5 },
      { skillId: 's3', name: 'Tailwind', proficiency: 4 },
    ],
    availabilityPercent: 50,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-002',
        allocationPercent: 50,
        roleName: 'Senior Frontend Dev',
      },
    ],
  },

  {
    id: '18',
    name: 'Arjun Rao',
    role: 'DevOps Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's11', name: 'Kubernetes', proficiency: 3 },
      { skillId: 's12', name: 'Docker', proficiency: 4 },
      { skillId: 's13', name: 'CI/CD', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '19',
    name: 'Meera Kulkarni',
    role: 'UX Designer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's9', name: 'Figma', proficiency: 5 },
      { skillId: 's10', name: 'Prototyping', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '20',
    name: 'Amit Verma',
    role: 'Product Manager',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's7', name: 'Agile', proficiency: 5 },
      { skillId: 's8', name: 'Jira', proficiency: 5 },
    ],
    availabilityPercent: 60,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-003',
        allocationPercent: 40,
        roleName: 'Product Manager',
      },
    ],
  },

  {
    id: '21',
    name: 'Karan Shah',
    role: 'Backend Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's4', name: 'Node.js', proficiency: 3 },
      { skillId: 's5', name: 'PostgreSQL', proficiency: 3 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '22',
    name: 'Pooja Nair',
    role: 'UX Designer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's9', name: 'Figma', proficiency: 4 },
      { skillId: 's10', name: 'Prototyping', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '23',
    name: 'Siddharth Jain',
    role: 'DevOps Engineer',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's11', name: 'Kubernetes', proficiency: 5 },
      { skillId: 's12', name: 'Docker', proficiency: 5 },
    ],
    availabilityPercent: 90,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-003',
        allocationPercent: 10,
        roleName: 'DevOps Engineer',
      },
    ],
  },

  {
    id: '24',
    name: 'Neha Agarwal',
    role: 'Senior Frontend Dev',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's1', name: 'React', proficiency: 5 },
      { skillId: 's2', name: 'TypeScript', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '25',
    name: 'Vikram Singh',
    role: 'Product Manager',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's7', name: 'Agile', proficiency: 4 },
      { skillId: 's8', name: 'Jira', proficiency: 4 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },

  {
    id: '26',
    name: 'Ananya Bose',
    role: 'Senior Frontend Dev',
    experienceLevel: 'SENIOR',
    skills: [
      { skillId: 's1', name: 'React', proficiency: 4 },
      { skillId: 's2', name: 'TypeScript', proficiency: 4 },
      { skillId: 's3', name: 'Tailwind', proficiency: 3 },
    ],
    availabilityPercent: 70,
    status: 'PARTIAL',
    currentProjects: [
      {
        projectId: 'proj-002',
        allocationPercent: 30,
        roleName: 'Senior Frontend Dev',
      },
    ],
  },

  {
    id: '27',
    name: 'Rohan Malhotra',
    role: 'Backend Engineer',
    experienceLevel: 'MID',
    skills: [
      { skillId: 's4', name: 'Node.js', proficiency: 4 },
      { skillId: 's5', name: 'PostgreSQL', proficiency: 3 },
    ],
    availabilityPercent: 100,
    status: 'BENCH',
    currentProjects: [],
  },
];
