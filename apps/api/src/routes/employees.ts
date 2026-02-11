import { Router } from 'express';

export const employeeRoutes = Router();
import { mockEmployees } from '../data/mockEmployees';

employeeRoutes.get('/', (req, res) => {
    res.json(mockEmployees);
});

employeeRoutes.get('/me', (req, res) => {
    res.json(mockEmployees[0]);
});
