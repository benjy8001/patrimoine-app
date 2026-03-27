import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/auth'

interface AuthState {
  user: User | null
  initialized: boolean
  setUser: (user: User | null) => void
  initialize: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    try {
      const user = await authApi.me()
      set({ user, initialized: true })
    } catch {
      set({ user: null, initialized: true })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      set({ user: null })
      window.location.href = '/login'
    }
  },
}))
