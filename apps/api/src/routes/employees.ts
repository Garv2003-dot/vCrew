import { Router } from 'express';

export const employeeRoutes = Router();

// Mock Data matching new schema
import { mockEmployees } from '../data/mockEmployees';

employeeRoutes.get('/', (req, res) => {
  // Simulate delay
  setTimeout(() => {
    res.json(mockEmployees);
  }, 500);
});

employeeRoutes.get('/me', (req, res) => {
  // Simulate delay
  setTimeout(() => {
    // Return first employee as "me"
    res.json(mockEmployees[0]);
  }, 500);
});
