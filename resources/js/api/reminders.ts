import api from './axios'
import type { Reminder } from '../types'

export const remindersApi = {
  async list(params?: Record<string, unknown>) {
    const res = await api.get<Reminder[]>('/reminders', { params })
    return res.data
  },

  async create(data: Partial<Reminder>) {
    const res = await api.post<Reminder>('/reminders', data)
    return res.data
  },

  async update(id: number, data: Partial<Reminder>) {
    const res = await api.put<Reminder>(`/reminders/${id}`, data)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/reminders/${id}`)
  },
}
