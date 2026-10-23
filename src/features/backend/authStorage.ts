import type { AuthState } from './authSlice'

// sessionStorage on purpose: the token must not outlive the tab and never goes to localStorage.
const KEY = 'backend:auth'

export function loadAuthState(): AuthState | undefined {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as AuthState
    return parsed?.accessToken && parsed.user ? parsed : undefined
  } catch {
    return undefined
  }
}

export function saveAuthState(state: AuthState) {
  try {
    if (state.accessToken) sessionStorage.setItem(KEY, JSON.stringify(state))
    else sessionStorage.removeItem(KEY)
  } catch {
    // storage unavailable: session simply won't survive a reload
  }
}
