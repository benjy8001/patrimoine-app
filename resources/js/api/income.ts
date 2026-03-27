import api from './axios'
import type { IncomeEntry, PaginatedResponse } from '../types'

export const incomeApi = {
  async list(params?: Record<string, unknown>) {
    const res = await api.get<PaginatedResponse<IncomeEntry>>('/income', { params })
    return res.data
  },

  async create(data: Partial<IncomeEntry>) {
    const res = await api.post<IncomeEntry>('/income', data)
    return res.data
  },

  async update(id: number, data: Partial<IncomeEntry>) {
    const res = await api.put<IncomeEntry>(`/income/${id}`, data)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/income/${id}`)
  },
}
