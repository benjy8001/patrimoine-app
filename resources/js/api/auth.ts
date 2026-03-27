import api from './axios'
import type { User } from '../types'

export const authApi = {
  async getCsrf() {
    await api.get('/sanctum/csrf-cookie', { baseURL: '' })
  },

  async login(email: string, password: string) {
    await authApi.getCsrf()
    const res = await api.post<{ user: User }>('/login', { email, password })
    return res.data.user
  },

  async register(name: string, email: string, password: string, password_confirmation: string) {
    await authApi.getCsrf()
    const res = await api.post<{ user: User }>('/register', { name, email, password, password_confirmation })
    return res.data.user
  },

  async logout() {
    await api.post('/logout')
  },

  async me() {
    const res = await api.get<User>('/user')
    return res.data
  },
}
