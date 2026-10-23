import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import authReducer, { type AuthState } from '@/features/backend/authSlice'
import { bindStoreToApi } from '@/features/backend/session'
import ocppReducer from '@/features/ocpp/ocppSlice'

export function renderWithProviders(ui: ReactElement, opts: { auth?: Partial<AuthState> } = {}) {
  const store = configureStore({
    reducer: { ocpp: ocppReducer, backendAuth: authReducer },
    preloadedState: opts.auth
      ? { backendAuth: { isSuperAdmin: false, ...opts.auth } as AuthState }
      : undefined,
  })
  bindStoreToApi(store)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const result = render(
    <Provider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  )
  return { store, ...result }
}
