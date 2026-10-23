import { describe, expect, it } from 'vitest'
import { resolveEnv } from './env'

describe('resolveEnv', () => {
  it('leaves the default CSMS URL empty when not configured', () => {
    expect(resolveEnv({})).toEqual({ DEFAULT_CSMS_URL: '' })
  })

  it('uses the configured value and strips trailing slashes', () => {
    expect(resolveEnv({ VITE_DEFAULT_CSMS_URL: 'wss://csms.example.com/ocpp/' })).toEqual({
      DEFAULT_CSMS_URL: 'wss://csms.example.com/ocpp',
    })
  })

  it('treats blank values as unset', () => {
    expect(resolveEnv({ VITE_DEFAULT_CSMS_URL: '  ' }).DEFAULT_CSMS_URL).toBe('')
  })
})
