export const mockProjects = [
  {
    projectId: 'proj-001',
    projectName: 'Payments Platform Revamp',
    client: 'Internal',
    status: 'ACTIVE',
    startDate: '2025-11-01',
    endDate: '2026-06-30',
    assignedEmployees: [
      { employeeId: '2', allocationPercent: 100, roleName: 'Backend Engineer' },
      { employeeId: '7', allocationPercent: 70, roleName: 'Backend Engineer' },
      { employeeId: '3', allocationPercent: 60, roleName: 'Product Manager' },
      { employeeId: '14', allocationPercent: 40, roleName: 'UX Designer' },
    ],
    openRoles: [
      {
        role: 'Backend Engineer',
        requiredSkills: ['Node.js', 'PostgreSQL'],
        additionalHeadcount: 1,
        urgency: 'HIGH',
      },
    ],
  },
  {
    projectId: 'proj-002',
    projectName: 'Mobile App Modernization',
    client: 'Retail Client A',
    status: 'ACTIVE',
    startDate: '2025-09-15',
    endDate: '2026-04-15',
    assignedEmployees: [
      {
        employeeId: '1',
        allocationPercent: 100,
        roleName: 'Senior Frontend Dev',
      },
      {
        employeeId: '17',
        allocationPercent: 50,
        roleName: 'Senior Frontend Dev',
      },
      { employeeId: '10', allocationPercent: 60, roleName: 'Product Manager' },
      {
        employeeId: '12',
        allocationPercent: 90,
        roleName: 'Senior Frontend Dev',
      },
      {
        employeeId: '26',
        allocationPercent: 30,
        roleName: 'Senior Frontend Dev',
      },
    ],
    openRoles: [
      {
        role: 'Frontend Developer',
        requiredSkills: ['React', 'TypeScript'],
        additionalHeadcount: 2,
        urgency: 'MEDIUM',
      },
    ],
  },
  {
    projectId: 'proj-003',
    projectName: 'Cloud Migration Phase 2',
    client: 'Enterprise Client B',
    status: 'ACTIVE',
    startDate: '2025-10-01',
    endDate: '2026-03-31',
    assignedEmployees: [
      { employeeId: '5', allocationPercent: 80, roleName: 'DevOps Engineer' },
      { employeeId: '9', allocationPercent: 100, roleName: 'DevOps Engineer' },
      { employeeId: '20', allocationPercent: 40, roleName: 'Product Manager' },
      { employeeId: '23', allocationPercent: 10, roleName: 'DevOps Engineer' },
    ],
    openRoles: [
      {
        role: 'DevOps Engineer',
        requiredSkills: ['Kubernetes', 'AWS'],
        additionalHeadcount: 1,
        urgency: 'HIGH',
      },
    ],
  },
];
