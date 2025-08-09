'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore()

  useEffect(() => {
    // Verificar se há sessão ativa no carregamento da página
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      }
    }

    checkAuth()
  }, [setUser])

  return <>{children}</>
}