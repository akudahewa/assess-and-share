import { apiClient, ApiResponse } from './api';

export interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionnaireData {
  title: string;
  description?: string;
}

export interface UpdateQuestionnaireData {
  title?: string;
  description?: string;
  is_active?: boolean;
}

class QuestionnaireService {
  async getAll(): Promise<ApiResponse<Questionnaire[]>> {
    return apiClient.get<Questionnaire[]>('/questionnaires');
  }

  async getById(id: string): Promise<ApiResponse<Questionnaire>> {
    return apiClient.get<Questionnaire>(`/questionnaires/${id}`);
  }

  async getActive(): Promise<ApiResponse<Questionnaire>> {
    return apiClient.get<Questionnaire>('/questionnaires/active');
  }

  async create(data: CreateQuestionnaireData): Promise<ApiResponse<Questionnaire>> {
    return apiClient.post<Questionnaire>('/questionnaires', data);
  }

  async update(id: string, data: UpdateQuestionnaireData): Promise<ApiResponse<Questionnaire>> {
    return apiClient.put<Questionnaire>(`/questionnaires/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/questionnaires/${id}`);
  }

  async activate(id: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/questionnaires/${id}/activate`);
  }
}

export const questionnaireService = new QuestionnaireService();