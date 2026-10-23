import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/features/backend/apiClient'
import { renderWithProviders } from '@/test/renderWithProviders'
import { BackendBrowserSheet } from './BackendBrowserSheet'

const auth = {
  accessToken: 'tok',
  activeOrgId: 'o1',
  user: {
    id: 'u1', email: 'a@b.co', firstName: 'Ada', emailVerified: true,
    memberships: [{ organizationId: 'o1', organizationName: 'Acme', role: 'ORG_ADMIN' }],
  },
}

const zones = [
  { id: 'z1', organizationId: 'o1', ownerId: 'u1', name: 'Downtown', status: 'ACTIVE' },
  { id: 'z2', organizationId: 'o1', ownerId: 'u1', name: 'Airport', status: 'ACTIVE' },
]
const chargers = [
  {
    id: 'c1', organizationId: 'o1', zoneId: 'z1', name: 'Lobby', evseId: 'SIM-001', status: 'OFFLINE',
    connectors: [
      { id: 'k1', connectorNumber: 1, type: 'Mennekes_Type_2', status: 'AVAILABLE' },
      { id: 'k2', connectorNumber: 2, type: 'CCS_Type_2', status: 'AVAILABLE' },
    ],
  },
]

describe('BackendBrowserSheet', () => {
  let mock: MockAdapter
  beforeEach(() => {
    mock = new MockAdapter(apiClient.http)
    mock.onGet('/charging-zones').reply(200, { items: zones, total: 2 })
    mock.onGet('/charge-points').reply(200, { items: chargers, total: 1 })
  })
  afterEach(() => mock.restore())

  it('lists zones with their chargers for the only organization', async () => {
    renderWithProviders(<BackendBrowserSheet open onOpenChange={() => {}} />, { auth })
    expect(await screen.findByText('Downtown')).toBeInTheDocument()
    expect(screen.getByText('Airport')).toBeInTheDocument()
    expect(await screen.findByText('SIM-001')).toBeInTheDocument()
    expect(screen.getByText('Lobby')).toBeInTheDocument()
    expect(screen.getByText('No chargers in this zone')).toBeInTheDocument()
  })

  it('imports a charger and marks it as imported', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<BackendBrowserSheet open onOpenChange={() => {}} />, { auth })
    const row = (await screen.findByText('SIM-001')).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Import' }))
    const imported = Object.values(store.getState().ocpp.items)
    expect(imported).toHaveLength(1)
    expect(imported[0].config.cpId).toBe('SIM-001')
    expect(imported[0].backend).toMatchObject({ organizationName: 'Acme', zoneName: 'Downtown' })
    expect(within(row).queryByRole('button', { name: 'Import' })).toBeNull()
    expect(within(row).getByText('Imported')).toBeInTheDocument()
  })
})
