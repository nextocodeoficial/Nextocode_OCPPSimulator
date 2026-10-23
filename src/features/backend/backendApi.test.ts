import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'
import { backendApi } from './backendApi'

describe('backendApi', () => {
  let mock: MockAdapter
  beforeEach(() => {
    mock = new MockAdapter(apiClient.http)
  })
  afterEach(() => mock.restore())

  it('logs in with the web context', async () => {
    mock.onPost('/auth/login').reply(200, { accessToken: 't', expiresIn: 900, organizationId: 'o1' })
    const res = await backendApi.login('a@b.c', 'pw')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ email: 'a@b.c', password: 'pw', context: 'web' })
    expect(res.accessToken).toBe('t')
  })

  it('loads the current user', async () => {
    mock.onGet('/auth/me').reply(200, { id: 'u', memberships: [] })
    expect((await backendApi.me()).id).toBe('u')
  })

  it('switches organization', async () => {
    mock.onPost('/auth/switch-organization').reply(200, { accessToken: 't2' })
    expect((await backendApi.switchOrganization('o2')).accessToken).toBe('t2')
  })

  it('fetches every page of organizations', async () => {
    const mk = (n: number, from: number) => Array.from({ length: n }, (_, i) => ({ id: `o${from + i}`, name: 'n', slug: 's', status: 'ACTIVE' }))
    mock.onGet('/organizations').reply((config) =>
      config.params.offset === 0 ? [200, { items: mk(100, 0), total: 130 }] : [200, { items: mk(30, 100), total: 130 }]
    )
    const orgs = await backendApi.listOrganizations()
    expect(orgs).toHaveLength(130)
    expect(mock.history.get.map((r) => r.params)).toEqual([
      { limit: 100, offset: 0 },
      { limit: 100, offset: 100 },
    ])
  })

  it('lists zones', async () => {
    mock.onGet('/charging-zones').reply(200, { items: [{ id: 'z1', name: 'Z' }], total: 1 })
    expect(await backendApi.listZones()).toEqual([{ id: 'z1', name: 'Z' }])
  })

  it('lists charge points, optionally by zone', async () => {
    mock.onGet('/charge-points').reply(200, { items: [], total: 0 })
    await backendApi.listChargePoints('z1')
    await backendApi.listChargePoints()
    expect(mock.history.get[0].params).toEqual({ limit: 100, offset: 0, zoneId: 'z1' })
    expect(mock.history.get[1].params).toEqual({ limit: 100, offset: 0 })
  })
})
