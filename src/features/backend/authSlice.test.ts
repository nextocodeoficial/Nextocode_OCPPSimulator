import { describe, expect, it, vi } from 'vitest'
import reducer, { loggedOut, sessionStarted, tokenRefreshed } from './authSlice'
import { loadAuthState, saveAuthState } from './authStorage'
import type { BackendUser } from './types'

const user = (over: Partial<BackendUser> = {}): BackendUser => ({
  id: 'u1',
  email: 'a@b.c',
  firstName: 'Ada',
  emailVerified: true,
  memberships: [],
  ...over,
})
const init = () => reducer(undefined, { type: '@@init' })

describe('authSlice', () => {
  it('starts logged out', () => {
    expect(init()).toEqual({ accessToken: undefined, user: undefined, activeOrgId: undefined, isSuperAdmin: false })
  })

  it('stores the session and derives isSuperAdmin', () => {
    const s = reducer(init(), sessionStarted({ accessToken: 't', user: user({ platformRole: 'SUPER_ADMIN' }), activeOrgId: undefined }))
    expect(s.accessToken).toBe('t')
    expect(s.isSuperAdmin).toBe(true)
    const s2 = reducer(init(), sessionStarted({ accessToken: 't', user: user(), activeOrgId: 'o1' }))
    expect(s2.isSuperAdmin).toBe(false)
    expect(s2.activeOrgId).toBe('o1')
  })

  it('updates the token and keeps the org when none is given', () => {
    let s = reducer(init(), sessionStarted({ accessToken: 't', user: user(), activeOrgId: 'o1' }))
    s = reducer(s, tokenRefreshed({ accessToken: 't2' }))
    expect(s).toMatchObject({ accessToken: 't2', activeOrgId: 'o1' })
    s = reducer(s, tokenRefreshed({ accessToken: 't3', organizationId: 'o2' }))
    expect(s).toMatchObject({ accessToken: 't3', activeOrgId: 'o2' })
  })

  it('clears everything on logout', () => {
    const s = reducer(reducer(init(), sessionStarted({ accessToken: 't', user: user(), activeOrgId: 'o1' })), loggedOut())
    expect(s).toEqual(init())
  })
})

describe('authStorage', () => {
  it('round-trips through sessionStorage, never localStorage', () => {
    const state = reducer(init(), sessionStarted({ accessToken: 't', user: user(), activeOrgId: 'o1' }))
    saveAuthState(state)
    expect(localStorage.length).toBe(0)
    expect(loadAuthState()).toEqual(state)
  })

  it('clears storage for a logged-out state', () => {
    saveAuthState(reducer(init(), sessionStarted({ accessToken: 't', user: user(), activeOrgId: 'o1' })))
    saveAuthState(init())
    expect(loadAuthState()).toBeUndefined()
  })

  it('returns undefined on corrupt data or unavailable storage', () => {
    sessionStorage.setItem('backend:auth', '{nope')
    expect(loadAuthState()).toBeUndefined()
    const spy = vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(loadAuthState()).toBeUndefined()
    spy.mockRestore()
  })

  it('swallows write errors', () => {
    const spy = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => saveAuthState(reducer(init(), sessionStarted({ accessToken: 't', user: user(), activeOrgId: 'o' })))).not.toThrow()
    spy.mockRestore()
  })
})
