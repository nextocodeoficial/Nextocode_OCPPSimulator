import { combineReducers, configureStore } from '@reduxjs/toolkit'

// Example UI slice: theme and sidebar state
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type Theme = 'light' | 'dark'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
}

const initialState: UiState = {
  theme: 'light',
  sidebarOpen: true,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
  },
})

export const { setTheme, toggleTheme, setSidebarOpen, toggleSidebar } = uiSlice.actions

import ocppReducer from '../features/ocpp/ocppSlice'
import { loadOcppState, saveOcppState } from '../features/ocpp/storage'

import authReducer from '../features/backend/authSlice'
import { loadAuthState, saveAuthState } from '../features/backend/authStorage'
import { bindStoreToApi } from '../features/backend/session'

const preloadedOcpp = loadOcppState()
const preloadedAuth = loadAuthState()

const rootReducer = combineReducers({
  ui: uiSlice.reducer,
  ocpp: ocppReducer,
  backendAuth: authReducer,
})

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    ...(preloadedOcpp ? { ocpp: preloadedOcpp } : {}),
    ...(preloadedAuth ? { backendAuth: preloadedAuth } : {}),
  } as Partial<ReturnType<typeof rootReducer>>,
})

bindStoreToApi(store)

// Persist ocpp slice to localStorage (simple throttle)
let persistTimer: number | undefined
store.subscribe(() => {
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    const state = store.getState() as any
    const ocpp = state.ocpp
    saveOcppState({ items: ocpp.items, order: ocpp.order, selectedId: ocpp.selectedId })
  }, 250)
  // Auth goes to sessionStorage immediately: a refreshed token must not be lost on reload.
  saveAuthState(store.getState().backendAuth)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
