import api from './axios'
import type { Platform } from '../types'

export const platformsApi = {
  async list() {
    const res = await api.get<Platform[]>('/platforms')
    return res.data
  },

  async create(data: Partial<Platform>) {
    const res = await api.post<Platform>('/platforms', data)
    return res.data
  },

  async update(id: number, data: Partial<Platform>) {
    const res = await api.put<Platform>(`/platforms/${id}`, data)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/platforms/${id}`)
  },
}
