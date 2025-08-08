// API client to replace Supabase with REST API calls
const API_BASE_URL = 'http://localhost:5002/api';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data.errors
    );
  }

  return data;
}

// Generic CRUD operations
export const api = {
  // GET requests
  get: <T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return fetch(url.toString()).then(res => res.json());
  },

  // POST requests
  post: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT requests
  put: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH requests
  patch: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE requests
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'DELETE',
    });
  },
};

// Specific API methods for each entity
export const questionnairesApi = {
  getAll: (params?: { active?: boolean; createdBy?: string; page?: number; limit?: number }) =>
    api.get('/questionnaires', params),
  
  getActive: () => api.get('/questionnaires/active'),
  
  getById: (id: string) => api.get(`/questionnaires/${id}`),
  
  create: (data: { title: string; description?: string; createdBy: string; isActive?: boolean; categories?: string[] }) =>
    api.post('/questionnaires', data),
  
  update: (id: string, data: { title?: string; description?: string; isActive?: boolean; categories?: string[] }) =>
    api.put(`/questionnaires/${id}`, data),
  
  delete: (id: string) => api.delete(`/questionnaires/${id}`),
  
  activate: (id: string) => api.patch(`/questionnaires/${id}/activate`),
  
  deactivate: (id: string) => api.patch(`/questionnaires/${id}/deactivate`),
  
  updateMetadata: (id: string) => api.patch(`/questionnaires/${id}/update-metadata`),
};

export const categoriesApi = {
  getAll: (params?: { questionnaireId?: string; active?: boolean; page?: number; limit?: number }) =>
    api.get('/categories', params),
  
  getActive: () => api.get('/categories/active'),
  
  getByQuestionnaire: (questionnaireId: string) => 
    api.get(`/categories/questionnaire/${questionnaireId}`),
  
  getById: (id: string) => api.get(`/categories/${id}`),
  
  create: (data: { name: string; description?: string; questionnaireId?: string; iconUrl?: string; order?: number }) =>
    api.post('/categories', data),
  
  update: (id: string, data: { name?: string; description?: string; questionnaireId?: string; iconUrl?: string; order?: number }) =>
    api.put(`/categories/${id}`, data),
  
  delete: (id: string) => api.delete(`/categories/${id}`),
  
  activate: (id: string) => api.patch(`/categories/${id}/activate`),
  
  deactivate: (id: string) => api.patch(`/categories/${id}/deactivate`),
};

export const questionsApi = {
  getAll: (params?: { questionnaireId?: string; categoryId?: string; type?: string; page?: number; limit?: number }) =>
    api.get('/questions', params),
  
  getByQuestionnaire: (questionnaireId: string) => 
    api.get(`/questions/questionnaire/${questionnaireId}`),
  
  getByCategory: (categoryId: string) => 
    api.get(`/questions/category/${categoryId}`),
  
  getById: (id: string) => api.get(`/questions/${id}`),
  
  create: (data: {
    questionnaireId: string;
    categoryId: string;
    text: string;
    type: 'multiple_choice' | 'text' | 'rating';
    options?: Array<{ value: string; label: string; score: number }>;
    orderNumber?: number;
    isRequired?: boolean;
  }) => api.post('/questions', data),
  
  update: (id: string, data: {
    questionnaireId?: string;
    categoryId?: string;
    text?: string;
    type?: 'multiple_choice' | 'text' | 'rating';
    options?: Array<{ value: string; label: string; score: number }>;
    orderNumber?: number;
    isRequired?: boolean;
  }) => api.put(`/questions/${id}`, data),
  
  delete: (id: string) => api.delete(`/questions/${id}`),
  
  reorder: (questionnaireId: string, questionOrders: Array<{ questionId: string; orderNumber: number }>) =>
    api.post('/questions/reorder', { questionnaireId, questionOrders }),
  
  getNextOrderNumber: (questionnaireId: string) => 
    api.get(`/questions/next-order/${questionnaireId}`),
};

export const userResponsesApi = {
  getAll: (params?: { questionnaireId?: string; userEmail?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/user-responses', params),
  
  getByQuestionnaire: (questionnaireId: string) => 
    api.get(`/user-responses/questionnaire/${questionnaireId}`),
  
  getByUser: (userEmail: string) => 
    api.get(`/user-responses/user/${userEmail}`),
  
  getById: (id: string) => api.get(`/user-responses/${id}`),
  
  create: (data: {
    questionnaireId: string;
    userName?: string;
    userEmail?: string;
    responses: Record<string, any>;
    timeSpent?: number;
    status?: 'in_progress' | 'completed' | 'abandoned';
  }) => api.post('/user-responses', data),
  
  update: (id: string, data: {
    questionnaireId?: string;
    userName?: string;
    userEmail?: string;
    responses?: Record<string, any>;
    timeSpent?: number;
    status?: 'in_progress' | 'completed' | 'abandoned';
  }) => api.put(`/user-responses/${id}`, data),
  
  delete: (id: string) => api.delete(`/user-responses/${id}`),
  
  complete: (id: string) => api.patch(`/user-responses/${id}/complete`),
  
  abandon: (id: string) => api.patch(`/user-responses/${id}/abandon`),
};

export const scoringRulesApi = {
  getAll: (params?: { questionnaireId?: string; categoryId?: string; page?: number; limit?: number }) =>
    api.get('/scoring-rules', params),
  
  getByQuestionnaire: (questionnaireId: string) => 
    api.get(`/scoring-rules/questionnaire/${questionnaireId}`),
  
  getByCategory: (categoryId: string) => 
    api.get(`/scoring-rules/category/${categoryId}`),
  
  getById: (id: string) => api.get(`/scoring-rules/${id}`),
  
  create: (data: {
    questionnaireId: string;
    categoryId?: string;
    minPercentage: number;
    maxPercentage: number;
    levelName: string;
    description?: string;
    color?: string;
  }) => api.post('/scoring-rules', data),
  
  update: (id: string, data: {
    questionnaireId?: string;
    categoryId?: string;
    minPercentage?: number;
    maxPercentage?: number;
    levelName?: string;
    description?: string;
    color?: string;
  }) => api.put(`/scoring-rules/${id}`, data),
  
  delete: (id: string) => api.delete(`/scoring-rules/${id}`),
  
  getLevelForPercentage: (questionnaireId: string, categoryId: string, percentage: number) =>
    api.post('/scoring-rules/level', { questionnaireId, categoryId, percentage }),
  
  createBulk: (rules: Array<{
    questionnaireId: string;
    categoryId?: string;
    minPercentage: number;
    maxPercentage: number;
    levelName: string;
    description?: string;
    color?: string;
  }>) => api.post('/scoring-rules/bulk', { rules }),
};

// Sample items API (for demonstration)
export const itemsApi = {
  getAll: (params?: { category?: string; inStock?: boolean; search?: string; page?: number; limit?: number }) =>
    api.get('/items', params),
  
  getById: (id: string) => api.get(`/items/${id}`),
  
  create: (data: { name: string; description?: string; price: number; category: string; inStock?: boolean; tags?: string[]; imageUrl?: string }) =>
    api.post('/items', data),
  
  update: (id: string, data: { name?: string; description?: string; price?: number; category?: string; inStock?: boolean; tags?: string[]; imageUrl?: string }) =>
    api.put(`/items/${id}`, data),
  
  delete: (id: string) => api.delete(`/items/${id}`),
  
  toggleStock: (id: string) => api.patch(`/items/${id}/toggle-stock`),
  
  getByCategory: (category: string) => api.get(`/items/category/${category}`),
  
  getInStock: () => api.get('/items/stock/in-stock'),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};

export { ApiError };
export type { ApiResponse }; 