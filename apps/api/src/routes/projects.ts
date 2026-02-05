import { Router } from 'express';
import { Project } from '@repo/types';

export const projectRoutes = Router();

// Mock Data matching new Project schema
const mockProjects: Project[] = [
  {
    id: '101',
    name: 'Alpha',
    description: 'Internal Tool for HR Management',
    startDate: '2024-01-01',
    durationMonths: 6,
    status: 'ACTIVE',
  },
  {
    id: '102',
    name: 'Beta',
    description: 'Mobile App for Customers',
    startDate: '2024-03-01',
    durationMonths: 12,
    status: 'PLANNED',
  },
  {
    id: '103',
    name: 'Gamma',
    description: 'Legacy System Migration',
    startDate: '2023-06-01',
    durationMonths: 18,
    status: 'COMPLETED',
  },
];

projectRoutes.get('/', (req, res) => {
  res.json(mockProjects);
});
