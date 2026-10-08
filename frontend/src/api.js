// API Client for 100% C REST Backend Server (http://localhost:8080)

const BASE_URL = 'http://localhost:8080/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn(`[API] Could not connect to C Backend at ${BASE_URL}${endpoint}. Using local state.`, err);
    return null;
  }
}

export const API = {
  // Auth & Registration
  registerUser: async (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginUser: async (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  quickLogin: async (role) => fetchAPI('/auth/quick-login', { method: 'POST', body: JSON.stringify({ role }) }),

  // Users Management
  getUsers: async () => fetchAPI('/users'),
  createUser: async (data) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: async (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),

  // Requests
  getRequests: async () => fetchAPI('/requests'),
  createRequest: async (data) => fetchAPI('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: async (id, data) => fetchAPI(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Bins Management
  getBins: async () => fetchAPI('/bins'),
  createBin: async (data) => fetchAPI('/bins', { method: 'POST', body: JSON.stringify(data) }),
  updateBin: async (id, data) => fetchAPI(`/bins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBin: async (id) => fetchAPI(`/bins/${id}`, { method: 'DELETE' }),

  // Trucks Management
  getTrucks: async () => fetchAPI('/trucks'),
  createTruck: async (data) => fetchAPI('/trucks', { method: 'POST', body: JSON.stringify(data) }),
  deleteTruck: async (id) => fetchAPI(`/trucks/${id}`, { method: 'DELETE' }),

  // Collectors Management
  getCollectors: async () => fetchAPI('/collectors'),
  createCollector: async (data) => fetchAPI('/collectors', { method: 'POST', body: JSON.stringify(data) }),
  deleteCollector: async (id) => fetchAPI(`/collectors/${id}`, { method: 'DELETE' }),

  // Routes
  getRoutes: async () => fetchAPI('/routes'),
  createRoute: async (data) => fetchAPI('/routes', { method: 'POST', body: JSON.stringify(data) }),

  // Task Action: Collector weight & completion
  completeTask: async (requestId, actualWeightKg) =>
    fetchAPI('/tasks/complete', {
      method: 'POST',
      body: JSON.stringify({ requestId, actualWeightKg: parseFloat(actualWeightKg) }),
    }),

  // Problems
  getProblems: async () => fetchAPI('/problems'),
  createProblem: async (data) => fetchAPI('/problems', { method: 'POST', body: JSON.stringify(data) }),
  updateProblem: async (id, data) => fetchAPI(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Reports Engine
  getReports: async () => fetchAPI('/reports'),
};
