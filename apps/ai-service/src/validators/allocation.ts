import { z } from 'zod';

export const AllocationSchema = z.object({
  projectId: z.string(),
  employeeIds: z.array(z.string()),
  justification: z.string(),
});

export type AllocationRequest = z.infer<typeof AllocationSchema>;
