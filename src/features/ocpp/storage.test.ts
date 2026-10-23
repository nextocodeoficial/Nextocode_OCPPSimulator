import { describe, expect, it } from 'vitest'
import reducer, { importFromBackend } from './ocppSlice'
import { loadOcppState, saveOcppState } from './storage'

describe('ocpp storage', () => {
  it('round-trips the backend origin of imported chargers', () => {
    const state = reducer(
      undefined,
      importFromBackend(
        { id: 'cp-1', organizationId: 'o1', zoneId: 'z1', name: 'N', evseId: 'SIM-001', status: 'OFFLINE', connectors: [] },
        { id: 'o1', name: 'Acme' },
        { id: 'z1', name: 'Zone' }
      )
    )
    saveOcppState(state)
    const loaded = loadOcppState()!
    const cp = Object.values(loaded.items)[0]
    expect(cp.backend).toEqual(Object.values(state.items)[0].backend)
    expect(cp.status).toBe('disconnected')
  })

  it('treats legacy items without backend as local', () => {
    saveOcppState({
      items: { a: { id: 'a', label: 'Old', config: { csmsUrl: 'ws://x', cpId: 'a', protocol: 'ocpp1.6' }, status: 'connected', paused: false, runtime: { connectors: [] } } },
      order: ['a'],
    })
    expect(loadOcppState()!.items.a.backend).toBeUndefined()
  })
})
