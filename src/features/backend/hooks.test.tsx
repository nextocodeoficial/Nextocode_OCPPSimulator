import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'
import authReducer, { type AuthState } from './authSlice'
import { useChargePoints, useOrganizations, useZones } from './hooks'
import { bindStoreToApi } from './session'

function setup(auth: Partial<AuthState>) {
  const store = configureStore({
    reducer: { backendAuth: authReducer },
    preloadedState: {
      backendAuth: {
        accessToken: 'tok',
        isSuperAdmin: false,
        user: { id: 'u1', email: 'a@b.c', firstName: 'A', emailVerified: true, memberships: [] },
        ...auth,
      },
    },
  })
  bindStoreToApi(store)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </Provider>
  )
  return { store, wrapper }
}

describe('backend hooks', () => {
  let mock: MockAdapter
  beforeEach(() => {
    mock = new MockAdapter(apiClient.http)
  })
  afterEach(() => mock.restore())

  it('lists organizations from the API for super admins', async () => {
    mock.onGet('/organizations').reply(200, { items: [{ id: 'o1', name: 'Acme', slug: 'acme', status: 'ACTIVE' }], total: 1 })
    const { wrapper } = setup({ isSuperAdmin: true })
    const { result } = renderHook(() => useOrganizations(), { wrapper })
    await waitFor(() => expect(result.current.organizations).toEqual([{ id: 'o1', name: 'Acme' }]))
  })

  it('uses memberships (no API call) for regular users', () => {
    const { wrapper } = setup({
      user: {
        id: 'u1', email: 'a@b.c', firstName: 'A', emailVerified: true,
        memberships: [{ organizationId: 'o9', organizationName: 'Nine', role: 'VIEWER' }],
      },
    })
    const { result } = renderHook(() => useOrganizations(), { wrapper })
    expect(result.current.organizations).toEqual([{ id: 'o9', name: 'Nine' }])
    expect(mock.history.get).toHaveLength(0)
  })

  it('switches organization before fetching zones and chargers', async () => {
    mock.onPost('/auth/switch-organization').reply(200, { accessToken: 'tok-o2' })
    mock.onGet('/charging-zones').reply((config) =>
      config.headers?.Authorization === 'Bearer tok-o2' ? [200, { items: [{ id: 'z1', name: 'Z' }], total: 1 }] : [403]
    )
    mock.onGet('/charge-points').reply((config) =>
      config.headers?.Authorization === 'Bearer tok-o2' ? [200, { items: [{ id: 'c1', zoneId: 'z1' }], total: 1 }] : [403]
    )
    const { wrapper, store } = setup({ activeOrgId: 'o1' })
    const zones = renderHook(() => useZones('o2'), { wrapper })
    const cps = renderHook(() => useChargePoints('o2'), { wrapper })
    await waitFor(() => expect(zones.result.current.data).toEqual([{ id: 'z1', name: 'Z' }]))
    await waitFor(() => expect(cps.result.current.data).toHaveLength(1))
    expect(store.getState().backendAuth.activeOrgId).toBe('o2')
    expect(mock.history.post).toHaveLength(1)
  })

  it('stays idle without an organization', () => {
    const { wrapper } = setup({})
    const { result } = renderHook(() => useZones(undefined), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
