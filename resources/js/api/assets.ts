import api from './axios'
import type { Asset, AssetValuation, PaginatedResponse } from '../types'

export const assetsApi = {
  async list(params?: Record<string, unknown>) {
    const res = await api.get<PaginatedResponse<Asset>>('/assets', { params })
    return res.data
  },

  async listAll(params?: Record<string, unknown>) {
    const res = await api.get<{ data: Asset[] }>('/assets', { params: { ...params, all: true } })
    return res.data.data
  },

  async get(id: number) {
    const res = await api.get<{ data: Asset }>(`/assets/${id}`)
    return res.data.data
  },

  async create(data: Partial<Asset>) {
    const res = await api.post<{ data: Asset }>('/assets', data)
    return res.data.data
  },

  async update(id: number, data: Partial<Asset>) {
    const res = await api.put<{ data: Asset }>(`/assets/${id}`, data)
    return res.data.data
  },

  async delete(id: number) {
    await api.delete(`/assets/${id}`)
  },

  async addValuation(assetId: number, data: { value: number; currency?: string; recorded_at?: string; notes?: string }) {
    const res = await api.post<AssetValuation>(`/assets/${assetId}/valuations`, data)
    return res.data
  },

  async getValuations(assetId: number) {
    const res = await api.get<PaginatedResponse<AssetValuation>>(`/assets/${assetId}/valuations`)
    return res.data
  },
}
