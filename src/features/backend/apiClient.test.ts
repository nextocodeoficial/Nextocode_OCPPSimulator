import MockAdapter from 'axios-mock-adapter'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient, type SessionBridge } from './apiClient'

function setup(initial: { token?: string; orgId?: string } = {}) {
  const state = { token: initial.token, orgId: initial.orgId }
  const bridge: SessionBridge = {
    getAccessToken: () => state.token,
    getActiveOrgId: () => state.orgId,
    onTokenRefreshed: vi.fn((token: string, orgId?: string) => {
      state.token = token
      if (orgId) state.orgId = orgId
    }),
    onAuthFailure: vi.fn(),
  }
  const client = createApiClient('http://api.test', bridge)
  const mock = new MockAdapter(client.http)
  return { state, bridge, client, mock }
}

describe('apiClient', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => {
    ctx = setup({ token: 'tok-1', orgId: 'org-1' })
  })

  it('sends the bearer token and credentials', async () => {
    ctx.mock.onGet('/organizations').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer tok-1')
      expect(config.withCredentials).toBe(true)
      return [200, { items: [], total: 0 }]
    })
    await ctx.client.http.get('/organizations')
    expect(ctx.mock.history.get).toHaveLength(1)
  })

  it('omits Authorization when there is no token', async () => {
    const c = setup()
    c.mock.onPost('/auth/login').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, {}]
    })
    await c.client.http.post('/auth/login', {})
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    let calls = 0
    ctx.mock.onGet('/zones').reply((config) => {
      calls++
      return config.headers?.Authorization === 'Bearer tok-2' ? [200, { ok: true }] : [401]
    })
    ctx.mock.onPost('/auth/refresh').reply(200, { accessToken: 'tok-2', organizationId: 'org-1' })

    const res = await ctx.client.http.get('/zones')
    expect(res.data).toEqual({ ok: true })
    expect(calls).toBe(2)
    expect(ctx.bridge.onTokenRefreshed).toHaveBeenCalledWith('tok-2', 'org-1')
    expect(ctx.bridge.onAuthFailure).not.toHaveBeenCalled()
  })

  it('shares one refresh between concurrent 401s', async () => {
    ctx.mock.onGet(/\/(a|b)$/).reply((config) =>
      config.headers?.Authorization === 'Bearer tok-2' ? [200, {}] : [401]
    )
    ctx.mock.onPost('/auth/refresh').reply(200, { accessToken: 'tok-2' })
    await Promise.all([ctx.client.http.get('/a'), ctx.client.http.get('/b')])
    expect(ctx.mock.history.post.filter((r) => r.url === '/auth/refresh')).toHaveLength(1)
  })

  it('logs out when refresh fails', async () => {
    ctx.mock.onGet('/zones').reply(401)
    ctx.mock.onPost('/auth/refresh').reply(401)
    await expect(ctx.client.http.get('/zones')).rejects.toBeTruthy()
    expect(ctx.bridge.onAuthFailure).toHaveBeenCalledTimes(1)
  })

  it('does not loop when the retried request is still 401', async () => {
    ctx.mock.onGet('/zones').reply(401)
    ctx.mock.onPost('/auth/refresh').reply(200, { accessToken: 'tok-2' })
    await expect(ctx.client.http.get('/zones')).rejects.toBeTruthy()
    expect(ctx.mock.history.post.filter((r) => r.url === '/auth/refresh')).toHaveLength(1)
  })

  it('does not try to refresh failed logins', async () => {
    ctx.mock.onPost('/auth/login').reply(401)
    await expect(ctx.client.http.post('/auth/login', {})).rejects.toBeTruthy()
    expect(ctx.mock.history.post.filter((r) => r.url === '/auth/refresh')).toHaveLength(0)
    expect(ctx.bridge.onAuthFailure).not.toHaveBeenCalled()
  })

  describe('withOrganization', () => {
    it('skips switching when already in the target org', async () => {
      const fn = vi.fn().mockResolvedValue('ok')
      await ctx.client.withOrganization('org-1', fn)
      expect(ctx.mock.history.post).toHaveLength(0)
      expect(fn).toHaveBeenCalled()
    })

    it('switches organization before running the callback', async () => {
      ctx.mock.onPost('/auth/switch-organization').reply(200, { accessToken: 'tok-org2' })
      const seen: (string | undefined)[] = []
      await ctx.client.withOrganization('org-2', async () => {
        seen.push(ctx.state.token, ctx.state.orgId)
      })
      expect(ctx.mock.history.post[0].data).toBe(JSON.stringify({ organizationId: 'org-2' }))
      expect(seen).toEqual(['tok-org2', 'org-2'])
    })

    it('serializes concurrent calls so tokens never interleave', async () => {
      ctx.mock.onPost('/auth/switch-organization').reply((config) => {
        const { organizationId } = JSON.parse(config.data)
        return [200, { accessToken: `tok-${organizationId}` }]
      })
      const order: string[] = []
      const run = (org: string) =>
        ctx.client.withOrganization(org, async () => {
          order.push(`start:${ctx.state.orgId}`)
          await new Promise((r) => setTimeout(r, 5))
          order.push(`end:${ctx.state.orgId}`)
        })
      await Promise.all([run('org-2'), run('org-3')])
      expect(order).toEqual(['start:org-2', 'end:org-2', 'start:org-3', 'end:org-3'])
    })

    it('releases the lock when the callback throws', async () => {
      await expect(ctx.client.withOrganization('org-1', async () => { throw new Error('boom') })).rejects.toThrow('boom')
      await expect(ctx.client.withOrganization('org-1', async () => 'fine')).resolves.toBe('fine')
    })
  })
})
