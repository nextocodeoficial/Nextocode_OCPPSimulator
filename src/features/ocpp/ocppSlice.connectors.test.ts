import { describe, expect, it } from 'vitest'
import reducer, { addChargePoint, setIdTag, setTransactionId, updateConnector, updateConnectorStatus } from './ocppSlice'

// A charge point whose runtime only knows connector 1, while its settings were changed to 2 connectors
// elsewhere (e.g. the config sheet persisted them straight to storage).
const withSingleRuntimeConnector = () => {
  const state = reducer(undefined, addChargePoint())
  const id = state.order[0]
  return { state, id }
}

const connector = (state: ReturnType<typeof reducer>, id: string, connectorId: number) =>
  state.items[id].runtime?.connectors?.find(c => c.id === connectorId)

describe('per-connector reducers on a connector missing from runtime', () => {
  it('updateConnectorStatus creates the connector', () => {
    const { state, id } = withSingleRuntimeConnector()
    const next = reducer(state, updateConnectorStatus({ id, connectorId: 2, status: 'Preparing' }))
    expect(connector(next, id, 2)).toMatchObject({ id: 2, status: 'Preparing' })
  })

  it('setTransactionId creates the connector', () => {
    const { state, id } = withSingleRuntimeConnector()
    const next = reducer(state, setTransactionId({ id, connectorId: 2, transactionId: 7 }))
    expect(connector(next, id, 2)).toMatchObject({ id: 2, transactionId: 7 })
  })

  it('setIdTag and updateConnector create the connector', () => {
    const { state, id } = withSingleRuntimeConnector()
    let next = reducer(state, setIdTag({ id, connectorId: 3, idTag: 'TAG-3' }))
    next = reducer(next, updateConnector({ id, connectorId: 4, updates: { status: 'Charging' } }))
    expect(connector(next, id, 3)).toMatchObject({ id: 3, idTag: 'TAG-3', status: 'Available' })
    expect(connector(next, id, 4)).toMatchObject({ id: 4, status: 'Charging' })
  })

  it('keeps connectors ordered by id', () => {
    const { state, id } = withSingleRuntimeConnector()
    let next = reducer(state, updateConnectorStatus({ id, connectorId: 3, status: 'Available' }))
    next = reducer(next, updateConnectorStatus({ id, connectorId: 2, status: 'Available' }))
    expect(next.items[id].runtime?.connectors?.map(c => c.id)).toEqual([1, 2, 3])
  })

  it('ignores invalid connector ids', () => {
    const { state, id } = withSingleRuntimeConnector()
    const next = reducer(state, updateConnectorStatus({ id, connectorId: 0, status: 'Preparing' }))
    expect(next.items[id].runtime?.connectors?.map(c => c.id)).toEqual([1])
  })
})
