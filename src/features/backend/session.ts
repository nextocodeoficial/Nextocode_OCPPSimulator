import { createAsyncThunk, type EnhancedStore } from '@reduxjs/toolkit'
import axios from 'axios'
import { bindSession } from './apiClient'
import { loggedOut, sessionStarted, tokenRefreshed, type AuthState } from './authSlice'
import { backendApi } from './backendApi'

type StoreWithAuth = Pick<EnhancedStore<{ backendAuth: AuthState }>, 'getState' | 'dispatch'>

/** Connects the HTTP client to the Redux session (token, active org, forced logout). */
export function bindStoreToApi(store: StoreWithAuth) {
  bindSession({
    getAccessToken: () => store.getState().backendAuth.accessToken,
    getActiveOrgId: () => store.getState().backendAuth.activeOrgId,
    onTokenRefreshed: (accessToken, organizationId) =>
      store.dispatch(tokenRefreshed({ accessToken, organizationId })),
    onAuthFailure: () => store.dispatch(loggedOut()),
  })
}

export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (!error.response) return 'Cannot reach the backend. Check VITE_BACKEND_API_URL and CORS.'
  }
  return 'Sign in failed'
}

export const loginThunk = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>(
  'backendAuth/login',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      await signIn(email, password, dispatch)
    } catch (error) {
      dispatch(loggedOut())
      return rejectWithValue(describeError(error))
    }
  }
)

async function signIn(email: string, password: string, dispatch: StoreWithAuth['dispatch']) {
  const session = await backendApi.login(email, password)
  // The token must be in the store before /auth/me so the interceptor can send it.
  dispatch(tokenRefreshed({ accessToken: session.accessToken, organizationId: session.organizationId }))
  const user = await backendApi.me()
  dispatch(
    sessionStarted({
      accessToken: session.accessToken,
      user,
      activeOrgId: session.organizationId ?? user.activeOrganizationId,
    })
  )
}

export const logoutThunk = createAsyncThunk('backendAuth/logout', async (_: void, { dispatch }) => {
  try {
    await backendApi.logout()
  } catch {
    // revoke is best-effort; local logout always happens
  }
  dispatch(loggedOut())
})
