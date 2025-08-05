import { apiClient, ApiResponse } from './api';

export interface Question {
  id: string;
  text: string;
  type: string;
  options: Array<{ text: string; score: number }>;
  category_id: string;
  questionnaire_id: string;
  order_number: number;
  created_at: string;
  updated_at: string;
  categories?: { name: string };
}

export interface CreateQuestionData {
  text: string;
  type?: string;
  options: Array<{ text: string; score: number }>;
  category_id: string;
  questionnaire_id: string;
  order_number: number;
}

export interface UpdateQuestionData {
  text?: string;
  type?: string;
  options?: Array<{ text: string; score: number }>;
  category_id?: string;
  order_number?: number;
}

class QuestionService {
  async getAll(): Promise<ApiResponse<Question[]>> {
    return apiClient.get<Question[]>('/questions');
  }

  async getByQuestionnaireId(questionnaireId: string): Promise<ApiResponse<Question[]>> {
    return apiClient.get<Question[]>(`/questions?questionnaire_id=${questionnaireId}`);
  }

  async getByCategoryId(categoryId: string): Promise<ApiResponse<Question[]>> {
    return apiClient.get<Question[]>(`/questions?category_id=${categoryId}`);
  }

  async getById(id: string): Promise<ApiResponse<Question>> {
    return apiClient.get<Question>(`/questions/${id}`);
  }

  async create(data: CreateQuestionData): Promise<ApiResponse<Question>> {
    return apiClient.post<Question>('/questions', data);
  }

  async update(id: string, data: UpdateQuestionData): Promise<ApiResponse<Question>> {
    return apiClient.put<Question>(`/questions/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/questions/${id}`);
  }

  async reorder(questionnaireId: string, questionIds: string[]): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/questions/reorder`, {
      questionnaire_id: questionnaireId,
      question_ids: questionIds,
    });
  }
}

export const questionService = new QuestionService();