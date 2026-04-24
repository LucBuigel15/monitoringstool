import { getAccessToken } from './auth';

// Use the backend server API (falls back to relative /api on Vercel)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiService {
  async get(endpoint) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GET error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async post(endpoint, data) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async patch(endpoint, data) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PATCH error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async delete(endpoint) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DELETE error ${response.status}: ${text}`);
    }

    return response.json();
  }
}

const apiService = new ApiService();

/* -------------------------------------------------------
   QUESTIONS API
------------------------------------------------------- */
export const questionsApi = {
  // GET all questions (optional params: page, limit, category, status, priority, search, sortBy, sortOrder, mode)
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/questions${qs ? '?' + qs : ''}`);
  },

  // CREATE a question
  create: (question) => apiService.post('/questions', question),

  // UPDATE by UUID
  update: (uuid, updates) =>
    apiService.patch(`/questions/${uuid}`, updates),

  // DELETE by UUID
  delete: (uuid) =>
    apiService.delete(`/questions/${uuid}`),

  // REORDER
  reorder: (order) =>
    apiService.post('/questions/reorder', { order }),
};

/* -------------------------------------------------------
   RESPONSES API
------------------------------------------------------- */
export const responsesApi = {
  // Submit survey response
  submit: (payload) => apiService.post('/responses', payload),

  // List responses (OLD - kept for compatibility if needed elsewhere)
  list: ({ page = 1, limit = 10, question_uuid, mode } = {}) => {
    const params = { page, limit };
    if (question_uuid) params.question_uuid = question_uuid;
    if (mode) params.mode = mode;
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/responses?${qs}`);
  },

  // GET Submissions (Groups) - NEW
  getSubmissions: ({ page = 1, limit = 10, survey_type } = {}) => {
    const params = { page, limit };
    if (survey_type) params.survey_type = survey_type;
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/submissions?${qs}`);
  },

  // Stats endpoint
  stats: (opts = {}) => {
    const qs = new URLSearchParams(opts).toString();
    return apiService.get(`/responses/stats${qs ? '?' + qs : ''}`);
  },
};

export default apiService;