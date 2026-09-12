export interface Category {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  defaultExpenseAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCategoryDto {
  name: string;
  type: string;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: string;
}

export interface ListCategoriesResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}
