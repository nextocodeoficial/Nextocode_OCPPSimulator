import { describe, expect, it } from 'vitest'
import type { ChargePoint } from './ocppSlice'
import { LOCAL_GROUP, groupChargePointsByOrganization } from './selectors'

const mk = (id: string, backend?: ChargePoint['backend']): ChargePoint => ({
  id,
  label: id,
  config: { csmsUrl: 'ws://x', cpId: id, protocol: 'ocpp1.6' },
  status: 'disconnected',
  paused: false,
  runtime: { connectors: [] },
  backend,
})
const be = (orgId: string, orgName: string): ChargePoint['backend'] => ({
  organizationId: orgId,
  organizationName: orgName,
  zoneId: 'z',
  zoneName: 'Zone',
  chargePointId: 'x',
  evseId: 'e',
})

describe('groupChargePointsByOrganization', () => {
  const items = { a: mk('a', be('o1', 'Beta')), b: mk('b'), c: mk('c', be('o1', 'Beta')), d: mk('d', be('o2', 'Alpha')) }
  const order = ['a', 'b', 'c', 'd']

  it('groups by organization, preserving order, with Local fallback last', () => {
    const groups = groupChargePointsByOrganization(items, order)
    expect(groups.map((g) => g.name)).toEqual(['Alpha', 'Beta', LOCAL_GROUP])
    expect(groups.find((g) => g.name === 'Beta')?.ids).toEqual(['a', 'c'])
    expect(groups.find((g) => g.name === LOCAL_GROUP)?.ids).toEqual(['b'])
  })

  it('filters by organization key', () => {
    expect(groupChargePointsByOrganization(items, order, 'o2').map((g) => g.name)).toEqual(['Alpha'])
    expect(groupChargePointsByOrganization(items, order, LOCAL_GROUP).map((g) => g.ids)).toEqual([['b']])
  })

  it('skips ids missing from items and omits empty groups', () => {
    expect(groupChargePointsByOrganization({}, ['zzz'])).toEqual([])
  })
})
