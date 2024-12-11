import { create } from 'zustand'
import { RegisterRequest, User } from '@/types/auth'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string, organizationId: string) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string, organizationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login({ email, password, organizationId })
      // Store tokens securely
      localStorage.setItem('refreshToken', response.refreshToken)
      document.cookie = `token=${response.accessToken}; path=/; secure; samesite=strict`
      set({ user: response.user, isLoading: false })
    } catch (error) {
      set({ error: 'Login failed', isLoading: false })
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.register(data)
      localStorage.setItem('refreshToken', response.refreshToken)
      document.cookie = `token=${response.accessToken}; path=/; secure; samesite=strict`
      set({ user: response.user, isLoading: false })
    } catch (error) {
      set({ error: 'Registration failed', isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('refreshToken')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    set({ user: null })
  },
}))