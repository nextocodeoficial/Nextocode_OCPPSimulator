import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/features/backend/apiClient'
import { renderWithProviders } from '@/test/renderWithProviders'
import { BackendLoginDialog } from './BackendLoginDialog'

describe('BackendLoginDialog', () => {
  let mock: MockAdapter
  beforeEach(() => {
    mock = new MockAdapter(apiClient.http)
  })
  afterEach(() => mock.restore())

  it('validates the email and requires a password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BackendLoginDialog open onOpenChange={() => {}} />)
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(0)
  })

  it('logs in and closes the dialog', async () => {
    mock.onPost('/auth/login').reply(200, { accessToken: 'tok', expiresIn: 900, organizationId: 'o1' })
    mock.onGet('/auth/me').reply(200, { id: 'u1', email: 'a@b.co', firstName: 'Ada', emailVerified: true, memberships: [] })
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    const { store } = renderWithProviders(<BackendLoginDialog open onOpenChange={onOpenChange} />)
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(store.getState().backendAuth.user?.email).toBe('a@b.co')
  })

  it('shows the backend error message on failure', async () => {
    mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' })
    const user = userEvent.setup()
    renderWithProviders(<BackendLoginDialog open onOpenChange={() => {}} />)
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'bad')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })
})
