/** DTOs mirroring backNextoway responses (read-only subset). */

export interface Page<T> {
  items: T[]
  total: number
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  organizationId?: string
}

export interface Membership {
  organizationId: string
  organizationName: string
  role: string
}

export interface BackendUser {
  id: string
  email: string
  firstName: string
  secondName?: string
  emailVerified: boolean
  platformRole?: 'SUPER_ADMIN'
  activeOrganizationId?: string
  memberships: Membership[]
}

export interface Organization {
  id: string
  name: string
  slug: string
  status: string
}

export interface Zone {
  id: string
  organizationId: string
  ownerId: string
  name: string
  address?: string
  status: string
}

export interface BackendConnector {
  id: string
  connectorNumber: number
  type: string
  status: string
  currentType?: string
  maxPowerKw?: number
  maxCurrentA?: number
  voltageV?: number
}

export interface BackendChargePoint {
  id: string
  organizationId: string
  zoneId: string
  name: string
  description?: string
  evseId: string
  status: string
  lastSeenAt?: string
  vendor?: string
  model?: string
  firmwareVersion?: string
  connectors: BackendConnector[]
}

/** Minimal org reference used across the UI (super admin list or membership). */
export interface OrgRef {
  id: string
  name: string
}
