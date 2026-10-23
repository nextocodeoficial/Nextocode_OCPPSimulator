import { BACKEND_API_URL } from '@/config/env'
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from './types'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Internal: never trigger the 401 -> refresh flow for this request. */
    _skipRefresh?: boolean
    /** Internal: request already retried after a refresh. */
    _retried?: boolean
  }
}

/** Bridge between the HTTP layer and wherever the session lives (Redux). */
export interface SessionBridge {
  getAccessToken(): string | undefined
  getActiveOrgId(): string | undefined
  onTokenRefreshed(accessToken: string, organizationId?: string): void
  onAuthFailure(): void
}

const AUTH_PATHS = ['/auth/login', '/auth/refresh']

export function createApiClient(baseURL: string, bridge: SessionBridge) {
  const http: AxiosInstance = axios.create({ baseURL, withCredentials: true })

  http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = bridge.getAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    else config.headers.delete('Authorization')
    return config
  })

  // Single-flight refresh: concurrent 401s share one /auth/refresh call.
  let refreshing: Promise<string> | undefined
  const refresh = () => {
    refreshing ??= http
      .post<LoginResponse>('/auth/refresh', undefined, { _skipRefresh: true })
      .then((res) => {
        bridge.onTokenRefreshed(res.data.accessToken, res.data.organizationId)
        return res.data.accessToken
      })
      .finally(() => {
        refreshing = undefined
      })
    return refreshing
  }

  http.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const config = error.config
      const skip =
        !config ||
        config._skipRefresh ||
        config._retried ||
        AUTH_PATHS.some((p) => config.url?.endsWith(p))
      if (error.response?.status !== 401 || skip) return Promise.reject(error)

      try {
        await refresh()
      } catch {
        bridge.onAuthFailure()
        return Promise.reject(error)
      }
      config._retried = true
      return http.request(config)
    }
  )

  // Serializes org switches + the calls that depend on them so the token
  // held by the session can never change between "switch" and "fetch".
  let queue: Promise<unknown> = Promise.resolve()
  function withOrganization<T>(organizationId: string, fn: () => Promise<T>): Promise<T> {
    const run = async () => {
      if (bridge.getActiveOrgId() !== organizationId) {
        const res = await http.post<LoginResponse>('/auth/switch-organization', { organizationId })
        bridge.onTokenRefreshed(res.data.accessToken, organizationId)
      }
      return fn()
    }
    const result = queue.then(run, run)
    queue = result.catch(() => undefined)
    return result
  }

  return { http, withOrganization }
}

// App-wide singleton; the session bridge is bound once the store exists.
let currentBridge: SessionBridge | undefined
export function bindSession(bridge: SessionBridge) {
  currentBridge = bridge
}

export const apiClient = createApiClient(BACKEND_API_URL, {
  getAccessToken: () => currentBridge?.getAccessToken(),
  getActiveOrgId: () => currentBridge?.getActiveOrgId(),
  onTokenRefreshed: (t, o) => currentBridge?.onTokenRefreshed(t, o),
  onAuthFailure: () => currentBridge?.onAuthFailure(),
})
