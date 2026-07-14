import { create } from 'zustand'
import Cookies from 'js-cookie'
import type { AuthResponse } from '@/types'

interface AuthState {
  user: AuthResponse | null
  token: string | null
  setAuth: (auth: AuthResponse) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(Cookies.get('user') || 'null') } catch { return null }
  })(),
  token: typeof window !== 'undefined' ? Cookies.get('token') || null : null,

  setAuth: (auth: AuthResponse) => {
    Cookies.set('token', auth.token, { expires: 1 })
    Cookies.set('user', JSON.stringify(auth), { expires: 1 })
    set({ user: auth, token: auth.token })
  },

  logout: () => {
    Cookies.remove('token')
    Cookies.remove('user')
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!get().token,
}))
