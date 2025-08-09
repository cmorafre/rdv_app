import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface User {
  id: number
  email: string
  nome: string
}

interface AppState {
  // Estados globais da aplicação
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Estado de autenticação
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'rdv-store' }
  )
)