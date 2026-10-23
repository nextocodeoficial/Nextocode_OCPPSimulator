import { describe, expect, it } from 'vitest'
import { resolveEnv } from './env'

describe('resolveEnv', () => {
  it('falls back to local defaults', () => {
    expect(resolveEnv({})).toEqual({
      BACKEND_API_URL: 'http://localhost:3001',
      OCPP_GATEWAY_URL: 'ws://localhost:8887',
    })
  })

  it('uses VITE_ overrides and trims trailing slashes', () => {
    expect(
      resolveEnv({
        VITE_BACKEND_API_URL: 'https://api.example.com/',
        VITE_OCPP_GATEWAY_URL: 'wss://gw.example.com',
      })
    ).toEqual({
      BACKEND_API_URL: 'https://api.example.com',
      OCPP_GATEWAY_URL: 'wss://gw.example.com',
    })
  })

  it('ignores blank values', () => {
    expect(resolveEnv({ VITE_BACKEND_API_URL: '  ' }).BACKEND_API_URL).toBe('http://localhost:3001')
  })
})
