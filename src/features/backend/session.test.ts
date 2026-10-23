import { configureStore } from '@reduxjs/toolkit'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'
import authReducer from './authSlice'
import { bindStoreToApi, loginThunk, logoutThunk } from './session'

const makeStore = () => {
  const store = configureStore({ reducer: { backendAuth: authReducer } })
  bindStoreToApi(store)
  return store
}

const me = (over = {}) => ({
  id: 'u1',
  email: 'a@b.c',
  firstName: 'Ada',
  emailVerified: true,
  memberships: [{ organizationId: 'o1', organizationName: 'Acme', role: 'ORG_ADMIN' }],
  ...over,
})

describe('session', () => {
  let mock: MockAdapter
  beforeEach(() => {
    mock = new MockAdapter(apiClient.http)
  })
  afterEach(() => mock.restore())

  it('logs in, loads /auth/me with the new token and stores the session', async () => {
    const store = makeStore()
    mock.onPost('/auth/login').reply(200, { accessToken: 'tok', expiresIn: 900, organizationId: 'o1' })
    mock.onGet('/auth/me').reply((config) =>
      config.headers?.Authorization === 'Bearer tok' ? [200, me()] : [401]
    )
    await store.dispatch(loginThunk({ email: 'a@b.c', password: 'pw' })).unwrap()
    expect(store.getState().backendAuth).toMatchObject({
      accessToken: 'tok',
      activeOrgId: 'o1',
      isSuperAdmin: false,
      user: { id: 'u1' },
    })
  })

  it('flags super admins', async () => {
    const store = makeStore()
    mock.onPost('/auth/login').reply(200, { accessToken: 'tok', expiresIn: 900 })
    mock.onGet('/auth/me').reply(200, me({ platformRole: 'SUPER_ADMIN', memberships: [] }))
    await store.dispatch(loginThunk({ email: 'a@b.c', password: 'pw' })).unwrap()
    expect(store.getState().backendAuth.isSuperAdmin).toBe(true)
    expect(store.getState().backendAuth.activeOrgId).toBeUndefined()
  })

  it('leaves the store logged out when credentials are rejected', async () => {
    const store = makeStore()
    mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' })
    await expect(store.dispatch(loginThunk({ email: 'a@b.c', password: 'bad' })).unwrap()).rejects.toBeTruthy()
    expect(store.getState().backendAuth.accessToken).toBeUndefined()
  })

  it('logs out locally even if the server call fails', async () => {
    const store = makeStore()
    mock.onPost('/auth/login').reply(200, { accessToken: 'tok', expiresIn: 900, organizationId: 'o1' })
    mock.onGet('/auth/me').reply(200, me())
    await store.dispatch(loginThunk({ email: 'a@b.c', password: 'pw' }))
    mock.onPost('/auth/logout').networkError()
    await store.dispatch(logoutThunk())
    expect(store.getState().backendAuth.accessToken).toBeUndefined()
  })

  it('auto-logs out when the refresh fails', async () => {
    const store = makeStore()
    mock.onPost('/auth/login').reply(200, { accessToken: 'tok', expiresIn: 900, organizationId: 'o1' })
    mock.onGet('/auth/me').reply(200, me())
    await store.dispatch(loginThunk({ email: 'a@b.c', password: 'pw' }))
    mock.onGet('/charging-zones').reply(401)
    mock.onPost('/auth/refresh').reply(401)
    await apiClient.http.get('/charging-zones').catch(() => undefined)
    expect(store.getState().backendAuth.accessToken).toBeUndefined()
  })
})
