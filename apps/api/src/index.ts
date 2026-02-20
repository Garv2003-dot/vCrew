import path from 'path';
import { config } from 'dotenv';

// Load .env: try repo root first (works when running from apps/api or from root)
const repoRootEnv = path.resolve(__dirname, '../../../.env');
config({ path: repoRootEnv });
config({ path: path.resolve(process.cwd(), '.env') });

// Handle self-signed certificates in development (e.g., corporate proxies)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    '[API] GEMINI_API_KEY is not set. Create a .env file at the project root (copy .env.example) and add your key.',
  );
}

import { allocationRoutes } from './routes/allocation';
import express from 'express';
import cors from 'cors';
import { employeeRoutes } from './routes/employees';
import { metadataRoutes } from './routes/metadata';
import { projectRoutes } from './routes/projects';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import { Request, Response } from 'express';

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/employees', employeeRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocation', allocationRoutes);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

// Force restart for AI update
