export interface Product {
  id: string;
  organizationId: string;
  name: string;
  hsn?: string;
  unit: string;
  rate: number;
  gstRate: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateProductDto {
  name: string;
  hsn?: string;
  unit: string;
  rate: number;
  gstRate: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface DeleteProductResponse {
  success: boolean;
}
