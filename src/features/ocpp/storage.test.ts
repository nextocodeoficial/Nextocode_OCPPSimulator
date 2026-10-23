import { describe, expect, it } from 'vitest'
import reducer, { addChargePoint } from './ocppSlice'
import { loadOcppState, saveOcppState } from './storage'

describe('ocpp storage', () => {
  it('round-trips every charger and resets connection status on load', () => {
    let state = reducer(undefined, addChargePoint({ label: 'A' }))
    state = reducer(state, addChargePoint({ label: 'B' }))
    const connected = { ...state, items: { ...state.items } }
    for (const id of connected.order) connected.items[id] = { ...connected.items[id], status: 'connected' }
    saveOcppState(connected)

    const loaded = loadOcppState()!
    expect(loaded.order).toEqual(state.order)
    expect(Object.values(loaded.items).map((cp) => cp.label).sort()).toEqual(['A', 'B'])
    expect(Object.values(loaded.items).every((cp) => cp.status === 'disconnected')).toBe(true)
  })

  it('ignores legacy fields from removed integrations', () => {
    saveOcppState({
      items: { a: { id: 'a', label: 'Old', config: { csmsUrl: 'ws://x', cpId: 'a', protocol: 'ocpp1.6' }, status: 'connected', paused: false, runtime: { connectors: [] }, backend: { organizationId: 'o1' } } },
      order: ['a'],
    })
    const item = loadOcppState()!.items.a
    expect(item.label).toBe('Old')
    expect(item.backend).toBeUndefined()
  })
})
