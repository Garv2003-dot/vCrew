import { allocationRoutes } from './routes/allocation';
import express from 'express';
import cors from 'cors';
import { employeeRoutes } from './routes/employees';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/employees', employeeRoutes);
app.use('/api/allocation', allocationRoutes);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

// Force restart for AI update
