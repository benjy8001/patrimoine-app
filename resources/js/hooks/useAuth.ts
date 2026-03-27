import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, initialized, initialize, logout, setUser } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  return { user, initialized, logout, setUser }
}
