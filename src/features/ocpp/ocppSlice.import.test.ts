import { describe, expect, it } from 'vitest'
import type { BackendChargePoint } from '@/features/backend/types'
import reducer, { importFromBackend } from './ocppSlice'

const backendCp: BackendChargePoint = {
  id: 'cp-1',
  organizationId: 'org-1',
  zoneId: 'zone-1',
  name: 'Lobby charger',
  evseId: 'SIM-001',
  status: 'OFFLINE',
  vendor: 'ACME',
  model: 'X1',
  connectors: [
    { id: 'c1', connectorNumber: 1, type: 'TYPE2', status: 'AVAILABLE', maxPowerKw: 22, currentType: 'AC' },
    { id: 'c2', connectorNumber: 2, type: 'CCS2', status: 'AVAILABLE', maxPowerKw: 50, currentType: 'DC' },
  ],
}
const org = { id: 'org-1', name: 'Acme Corp' }
const zone = { id: 'zone-1', name: 'Downtown' }

const empty = () => reducer(undefined, { type: '@@init' })

describe('importFromBackend', () => {
  it('maps evseId to cpId and the gateway URL', () => {
    const state = reducer(empty(), importFromBackend(backendCp, org, zone))
    const cp = Object.values(state.items)[0]
    expect(cp.config).toEqual({
      csmsUrl: 'ws://localhost:8887',
      cpId: 'SIM-001',
      protocol: 'ocpp1.6',
    })
    expect(cp.label).toBe('Lobby charger')
    expect(cp.status).toBe('disconnected')
  })

  it('creates connectors from backend connector numbers', () => {
    const state = reducer(empty(), importFromBackend(backendCp, org, zone))
    const cp = Object.values(state.items)[0]
    expect(cp.chargePointConfig?.deviceSettings.connectors).toBe(2)
    expect(cp.runtime.connectors.map((c) => c.id)).toEqual([1, 2])
    expect(cp.runtime.connectors.every((c) => c.status === 'Available')).toBe(true)
    expect(cp.chargePointConfig?.deviceSettings.maxPowerKw).toBe(50)
    expect(cp.chargePointConfig?.deviceSettings.acdc).toBe('DC')
  })

  it('uses non-contiguous connector numbers as ids', () => {
    const sparse = {
      ...backendCp,
      connectors: [{ ...backendCp.connectors[0], connectorNumber: 3 }],
    }
    const state = reducer(empty(), importFromBackend(sparse, org, zone))
    const cp = Object.values(state.items)[0]
    expect(cp.runtime.connectors.map((c) => c.id)).toEqual([3])
    expect(cp.chargePointConfig?.deviceSettings.connectors).toBe(1)
  })

  it('stores backend origin metadata', () => {
    const state = reducer(empty(), importFromBackend(backendCp, org, zone))
    expect(Object.values(state.items)[0].backend).toEqual({
      organizationId: 'org-1',
      organizationName: 'Acme Corp',
      zoneId: 'zone-1',
      zoneName: 'Downtown',
      chargePointId: 'cp-1',
      evseId: 'SIM-001',
    })
  })

  it('does not duplicate an already imported charger and selects it instead', () => {
    let state = reducer(empty(), importFromBackend(backendCp, org, zone))
    const firstId = state.order[0]
    state = reducer(state, importFromBackend({ ...backendCp, id: 'cp-2', evseId: 'SIM-002' }, org, zone))
    expect(state.order).toHaveLength(2)
    state = reducer(state, importFromBackend(backendCp, org, zone))
    expect(state.order).toHaveLength(2)
    expect(state.selectedId).toBe(firstId)
  })
})
