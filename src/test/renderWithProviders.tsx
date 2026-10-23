import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import ocppReducer from '@/features/ocpp/ocppSlice'
import '@/i18n'

export function renderWithProviders(ui: ReactElement) {
  const store = configureStore({ reducer: { ocpp: ocppReducer } })
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
