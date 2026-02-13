export const API_BASE_URL = 'http://localhost:3001/api';

export const ENDPOINTS = {
  EMPLOYEES: {
    LIST: `${API_BASE_URL}/employees`,
    ME: `${API_BASE_URL}/employees/me`,
  },
  ALLOCATION: {
    DEMAND: `${API_BASE_URL}/allocation/demand`,
    LOADING_DEMAND: `${API_BASE_URL}/allocation/loading-demand`,
    INSTRUCTION: `${API_BASE_URL}/allocation/instruction`,
  },
  PROJECTS: {
    LIST: `${API_BASE_URL}/projects`,
  },
};
