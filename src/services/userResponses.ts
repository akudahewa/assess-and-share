import { apiClient, ApiResponse } from './api';

export interface UserResponse {
  id: string;
  questionnaire_id: string;
  user_name: string | null;
  user_email: string | null;
  responses: Record<string, number>;
  scores: Array<{
    category: string;
    score: number;
    maxScore: number;
    percentage: number;
    level: string;
    color: string;
  }>;
  completed_at: string;
}

export interface CreateUserResponseData {
  questionnaire_id: string;
  user_name?: string;
  user_email?: string;
  responses: Record<string, number>;
  scores: Array<{
    category: string;
    score: number;
    maxScore: number;
    percentage: number;
    level: string;
    color: string;
  }>;
}

class UserResponseService {
  async getAll(): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>('/user-responses');
  }

  async getByQuestionnaireId(questionnaireId: string): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>(`/user-responses?questionnaire_id=${questionnaireId}`);
  }

  async getById(id: string): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>(`/user-responses/${id}`);
  }

  async create(data: CreateUserResponseData): Promise<ApiResponse<UserResponse>> {
    return apiClient.post<UserResponse>('/user-responses', data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/user-responses/${id}`);
  }

  async getStats(questionnaireId: string): Promise<ApiResponse<{
    total_responses: number;
    average_scores: Record<string, number>;
    completion_rate: number;
  }>> {
    return apiClient.get(`/user-responses/stats?questionnaire_id=${questionnaireId}`);
  }
}

export const userResponseService = new UserResponseService();