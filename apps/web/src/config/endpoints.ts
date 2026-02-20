export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ENDPOINTS = {
  EMPLOYEES: {
    LIST: `${API_BASE_URL}/api/employees`,
    ME: `${API_BASE_URL}/api/employees/me`,
  },
  ALLOCATION: {
    DEMAND: `${API_BASE_URL}/api/allocation/demand`,
    LOADING_DEMAND: `${API_BASE_URL}/api/allocation/loading-demand`,
    INSTRUCTION: `${API_BASE_URL}/api/allocation/instruction`,
    AGENTIC: `${API_BASE_URL}/api/allocation/agentic`,
    AGENTIC_STREAM: `${API_BASE_URL}/api/allocation/agentic/stream`,
  },
  PROJECTS: {
    LIST: `${API_BASE_URL}/api/projects`,
  },
};
