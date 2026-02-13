export const mockProjects = [
  {
    projectId: 'proj-001',
    projectName: 'Rhapsody',
    client: 'Rhapsody',
    logo: '/logos/rhapsody-logo.png',
    status: 'ACTIVE',
    startDate: '2025-11-01',
    endDate: '2026-06-30',
    assignedEmployees: [
      { employeeId: '2', allocationPercent: 100, roleName: 'Backend Engineer' },
      { employeeId: '7', allocationPercent: 70, roleName: 'Backend Engineer' },
      { employeeId: '3', allocationPercent: 60, roleName: 'Product Manager' },
      { employeeId: '14', allocationPercent: 40, roleName: 'UX Designer' },
      {
        employeeId: '1',
        allocationPercent: 10,
        roleName: 'Senior Frontend Dev',
      },
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
    projectName: 'Neovance',
    client: 'Neovance',
    logo: '/logos/neovance-logo.jpeg',
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
    projectName: 'Valeris',
    client: 'Valeris',
    logo: '/logos/valeris-logo.jpeg',
    status: 'ACTIVE',
    startDate: '2025-10-01',
    endDate: '2026-03-31',
    assignedEmployees: [
      { employeeId: '5', allocationPercent: 80, roleName: 'DevOps Engineer' },
      { employeeId: '9', allocationPercent: 100, roleName: 'DevOps Engineer' },
      { employeeId: '20', allocationPercent: 40, roleName: 'Product Manager' },
      { employeeId: '23', allocationPercent: 10, roleName: 'DevOps Engineer' },
      {
        employeeId: '1',
        allocationPercent: 10,
        roleName: 'Senior Frontend Dev',
      },
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

  {
    projectId: 'proj-004',
    projectName: 'HHAexchange',
    client: 'HHAexchange',
    logo: '/logos/hhax-logo.jpeg',
    status: 'ACTIVE',
    startDate: '2025-12-01',
    endDate: '2026-08-01',
    assignedEmployees: [
      {
        employeeId: '11',
        allocationPercent: 100,
        roleName: 'Backend Engineer',
      },
      { employeeId: '8', allocationPercent: 100, roleName: 'UX Designer' },
      { employeeId: '25', allocationPercent: 100, roleName: 'Product Manager' },
    ],
    openRoles: [
      {
        role: 'Backend Engineer',
        requiredSkills: ['Node.js', 'AWS'],
        additionalHeadcount: 1,
        urgency: 'MEDIUM',
      },
    ],
  },

  {
    projectId: 'proj-005',
    projectName: 'Health Catalyst',
    client: 'Health Catalyst',
    logo: '/logos/healthcatalys-logo.jpeg',
    status: 'ACTIVE',
    startDate: '2025-08-01',
    endDate: '2026-02-28',
    assignedEmployees: [
      {
        employeeId: '16',
        allocationPercent: 100,
        roleName: 'Backend Engineer',
      },
      { employeeId: '19', allocationPercent: 100, roleName: 'UX Designer' },
      { employeeId: '13', allocationPercent: 100, roleName: 'Product Manager' },
    ],
    openRoles: [
      {
        role: 'Frontend Developer',
        requiredSkills: ['React', 'TypeScript'],
        additionalHeadcount: 1,
        urgency: 'HIGH',
      },
    ],
  },

  {
    projectId: 'proj-006',
    projectName: 'Kipu Healthcare',
    client: 'Kipu Healthcare',
    logo: '/logos/kipu-logo.jpeg',
    status: 'ACTIVE',
    startDate: '2025-07-15',
    endDate: '2026-01-31',
    assignedEmployees: [
      { employeeId: '15', allocationPercent: 100, roleName: 'DevOps Engineer' },
      {
        employeeId: '21',
        allocationPercent: 100,
        roleName: 'Backend Engineer',
      },
      { employeeId: '22', allocationPercent: 100, roleName: 'UX Designer' },
    ],
    openRoles: [
      {
        role: 'DevOps Engineer',
        requiredSkills: ['Kubernetes', 'CI/CD'],
        additionalHeadcount: 1,
        urgency: 'MEDIUM',
      },
    ],
  },
];
