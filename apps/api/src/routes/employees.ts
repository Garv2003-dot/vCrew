import { Router, Request, Response } from 'express';
import { fetchEmployeesFromSupabase } from '../services/employeesService';

export const employeeRoutes = Router();

employeeRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await fetchEmployeesFromSupabase();
    res.json(employees);
  } catch (err) {
    console.error('Failed to fetch employees', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch employees',
    });
  }
});

employeeRoutes.get('/me', async (req: Request, res: Response) => {
  try {
    const employees = await fetchEmployeesFromSupabase();
    const first = employees.find((e) => e.employeeId === '10391');
    if (!first) {
      return res.status(404).json({ error: 'No employees found' });
    }
    res.json(first);
  } catch (err) {
    console.error('Failed to fetch current employee', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch employee',
    });
  }
});

employeeRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const employees = await fetchEmployeesFromSupabase();
    const emp = employees.find((e) => e.id === req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(emp);
  } catch (err) {
    console.error('Failed to fetch employee', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch employee',
    });
  }
});
