import apiClient from './api'

export interface DealItem extends Record<string, any> {
  id: number
}

export interface DealsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface GetDealsOptions {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface GetDealsResponse {
  data: DealItem[]
  pagination: DealsPagination
}

export const getDeals = async (options: GetDealsOptions): Promise<GetDealsResponse> => {
  const response = await apiClient.get('/deals', {
    params: options,
  })
  return response.data;
}

export const deleteDeal = async (id: number): Promise<{ success: boolean; message?: string }> => {
  const response = await apiClient.delete(`/deals/${id}`)
  return response.data;
}
