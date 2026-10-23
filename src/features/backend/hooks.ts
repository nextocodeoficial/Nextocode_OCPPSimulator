import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { apiClient } from './apiClient'
import type { AuthState } from './authSlice'
import { backendApi } from './backendApi'
import type { OrgRef } from './types'

type WithAuth = { backendAuth: AuthState }

export const useBackendAuth = () => useSelector((s: WithAuth) => s.backendAuth)

export function useOrganizations() {
  const { isSuperAdmin, user, accessToken } = useBackendAuth()
  const query = useQuery({
    queryKey: ['backend', user?.id, 'organizations'],
    queryFn: () => backendApi.listOrganizations(),
    enabled: Boolean(accessToken) && isSuperAdmin,
  })
  const organizations: OrgRef[] = isSuperAdmin
    ? (query.data ?? []).map((o) => ({ id: o.id, name: o.name }))
    : (user?.memberships ?? []).map((m) => ({ id: m.organizationId, name: m.organizationName }))
  return { organizations, isLoading: isSuperAdmin && query.isLoading, error: query.error }
}

/** Zones of an organization; the token is switched to that org first (serialized). */
export function useZones(orgId?: string) {
  const { user, accessToken } = useBackendAuth()
  return useQuery({
    queryKey: ['backend', user?.id, 'zones', orgId],
    queryFn: () => apiClient.withOrganization(orgId!, () => backendApi.listZones()),
    enabled: Boolean(accessToken && orgId),
  })
}

export function useChargePoints(orgId?: string) {
  const { user, accessToken } = useBackendAuth()
  return useQuery({
    queryKey: ['backend', user?.id, 'charge-points', orgId],
    queryFn: () => apiClient.withOrganization(orgId!, () => backendApi.listChargePoints()),
    enabled: Boolean(accessToken && orgId),
  })
}
