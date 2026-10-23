import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { BackendUser } from './types'

export interface AuthState {
  accessToken?: string
  user?: BackendUser
  activeOrgId?: string
  isSuperAdmin: boolean
}

const initialState: AuthState = {
  accessToken: undefined,
  user: undefined,
  activeOrgId: undefined,
  isSuperAdmin: false,
}

const authSlice = createSlice({
  name: 'backendAuth',
  initialState,
  reducers: {
    sessionStarted(
      state,
      action: PayloadAction<{ accessToken: string; user: BackendUser; activeOrgId?: string }>
    ) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.activeOrgId = action.payload.activeOrgId
      state.isSuperAdmin = action.payload.user.platformRole === 'SUPER_ADMIN'
    },
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string; organizationId?: string }>) {
      state.accessToken = action.payload.accessToken
      if (action.payload.organizationId) state.activeOrgId = action.payload.organizationId
    },
    loggedOut() {
      return initialState
    },
  },
})

export const { sessionStarted, tokenRefreshed, loggedOut } = authSlice.actions
export default authSlice.reducer
