import { apiClient, ApiResponse } from './api';

export interface ScoringRule {
  id: string;
  questionnaire_id: string;
  category_id: string | null;
  min_percentage: number;
  max_percentage: number;
  level_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScoringRuleData {
  questionnaire_id: string;
  category_id?: string;
  min_percentage: number;
  max_percentage: number;
  level_name: string;
  description?: string;
}

export interface UpdateScoringRuleData {
  category_id?: string;
  min_percentage?: number;
  max_percentage?: number;
  level_name?: string;
  description?: string;
}

class ScoringRuleService {
  async getAll(): Promise<ApiResponse<ScoringRule[]>> {
    return apiClient.get<ScoringRule[]>('/scoring-rules');
  }

  async getByQuestionnaireId(questionnaireId: string): Promise<ApiResponse<ScoringRule[]>> {
    return apiClient.get<ScoringRule[]>(`/scoring-rules?questionnaire_id=${questionnaireId}`);
  }

  async getById(id: string): Promise<ApiResponse<ScoringRule>> {
    return apiClient.get<ScoringRule>(`/scoring-rules/${id}`);
  }

  async create(data: CreateScoringRuleData): Promise<ApiResponse<ScoringRule>> {
    return apiClient.post<ScoringRule>('/scoring-rules', data);
  }

  async update(id: string, data: UpdateScoringRuleData): Promise<ApiResponse<ScoringRule>> {
    return apiClient.put<ScoringRule>(`/scoring-rules/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/scoring-rules/${id}`);
  }
}

export const scoringRuleService = new ScoringRuleService();