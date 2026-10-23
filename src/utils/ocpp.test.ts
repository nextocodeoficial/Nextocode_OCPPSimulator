import { describe, expect, it } from 'vitest'
import { buildOcppWebSocketUrl } from './ocpp'

describe('buildOcppWebSocketUrl', () => {
  it('appends the evseId to the gateway root', () => {
    expect(buildOcppWebSocketUrl('ws://localhost:8887', 'SIM-001')).toBe('ws://localhost:8887/SIM-001')
  })

  it('tolerates a trailing slash and the legacy /ws suffix', () => {
    expect(buildOcppWebSocketUrl('ws://localhost:8887/', 'SIM-001')).toBe('ws://localhost:8887/SIM-001')
    expect(buildOcppWebSocketUrl('ws://localhost:8887/ws', 'SIM-001')).toBe('ws://localhost:8887/SIM-001')
  })

  it('encodes unsafe ids and keeps custom path prefixes', () => {
    expect(buildOcppWebSocketUrl('wss://gw.example.com/ocpp', 'A B')).toBe('wss://gw.example.com/ocpp/A%20B')
  })

  it('rejects an empty URL', () => {
    expect(() => buildOcppWebSocketUrl('  ', 'x')).toThrow()
  })
})
