import { apiClient, ApiResponse } from './api';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  questionnaire_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  questionnaire_id: string;
  icon_file?: File;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon_file?: File;
}

class CategoryService {
  async getAll(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories');
  }

  async getByQuestionnaireId(questionnaireId: string): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>(`/categories?questionnaire_id=${questionnaireId}`);
  }

  async getById(id: string): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`/categories/${id}`);
  }

  async create(data: CreateCategoryData): Promise<ApiResponse<Category>> {
    if (data.icon_file) {
      // First upload the icon
      const uploadResponse = await apiClient.upload('/uploads/category-icons', data.icon_file);
      if (uploadResponse.success) {
        const categoryData = {
          name: data.name,
          description: data.description,
          questionnaire_id: data.questionnaire_id,
          icon_url: uploadResponse.data.url,
        };
        return apiClient.post<Category>('/categories', categoryData);
      }
      throw new Error('Failed to upload icon');
    } else {
      const categoryData = {
        name: data.name,
        description: data.description,
        questionnaire_id: data.questionnaire_id,
      };
      return apiClient.post<Category>('/categories', categoryData);
    }
  }

  async update(id: string, data: UpdateCategoryData): Promise<ApiResponse<Category>> {
    if (data.icon_file) {
      // First upload the new icon
      const uploadResponse = await apiClient.upload('/uploads/category-icons', data.icon_file);
      if (uploadResponse.success) {
        const updateData = {
          name: data.name,
          description: data.description,
          icon_url: uploadResponse.data.url,
        };
        return apiClient.put<Category>(`/categories/${id}`, updateData);
      }
      throw new Error('Failed to upload icon');
    } else {
      const updateData = {
        name: data.name,
        description: data.description,
      };
      return apiClient.put<Category>(`/categories/${id}`, updateData);
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/categories/${id}`);
  }
}

export const categoryService = new CategoryService();