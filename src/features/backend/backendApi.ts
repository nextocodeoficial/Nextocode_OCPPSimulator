import { apiClient } from './apiClient'
import type {
  BackendChargePoint,
  BackendUser,
  LoginResponse,
  Organization,
  Page,
  Zone,
} from './types'

const { http } = apiClient

// Backend caps `limit` at 100.
const PAGE_SIZE = 100

async function fetchAll<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const all: T[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data } = await http.get<Page<T>>(url, { params: { limit: PAGE_SIZE, offset, ...params } })
    all.push(...data.items)
    if (data.items.length === 0 || all.length >= data.total) return all
  }
}

export const backendApi = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { email, password, context: 'web' }).then((r) => r.data),
  logout: () => http.post('/auth/logout', undefined, { _skipRefresh: true }).then(() => undefined),
  me: () => http.get<BackendUser>('/auth/me').then((r) => r.data),
  switchOrganization: (organizationId: string) =>
    http.post<LoginResponse>('/auth/switch-organization', { organizationId }).then((r) => r.data),
  listOrganizations: () => fetchAll<Organization>('/organizations'),
  listZones: () => fetchAll<Zone>('/charging-zones'),
  listChargePoints: (zoneId?: string) =>
    fetchAll<BackendChargePoint>('/charge-points', zoneId ? { zoneId } : {}),
}
