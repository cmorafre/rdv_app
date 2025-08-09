'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

export function useAuth() {
  const router = useRouter()
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAppStore()

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      storeLogout()
      router.push('/login')
      router.refresh()
    }
  }

  return {
    user,
    isAuthenticated,
    logout,
    setUser,
  }
}