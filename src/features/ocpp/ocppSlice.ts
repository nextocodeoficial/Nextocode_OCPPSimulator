import { normalizeDeviceSettings, normalizeOcppConfiguration } from '@/constants/chargePointDefaults'
import type { ChargePointConfiguration, DeviceSettings, OcppConfiguration, Connector } from '@/types/ocpp'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, nanoid } from '@reduxjs/toolkit'
import { OCPP_GATEWAY_URL } from '@/config/env'
import type { BackendChargePoint, OrgRef } from '@/features/backend/types'

export type Protocol = 'ocpp1.6' | 'ocpp2.0.1'

export interface ConnectionConfig {
  csmsUrl: string
  cpId: string
  protocol: Protocol
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface ChargePointRuntime {
  connectors: Connector[];
  activeConnectorId?: number; // for backward compatibility or current selection
}

export interface BackendOrigin {
  organizationId: string
  organizationName: string
  zoneId: string
  zoneName: string
  chargePointId: string
  evseId: string
}

export interface ChargePoint {
  id: string
  label: string
  config: ConnectionConfig
  status: ConnectionStatus
  paused: boolean
  runtime: ChargePointRuntime
  chargePointConfig?: ChargePointConfiguration
  /** Present only for chargers imported from backNextoway; absent means "Local". */
  backend?: BackendOrigin
}

interface OcppState {
  items: Record<string, ChargePoint>
  order: string[]
  selectedId?: string
}

/** Maps a backNextoway ConnectorType to the simulator's socket options. */
function toSocketType(type: string): string {
  if (type.startsWith('CCS')) return 'CCS'
  if (type === 'CHAdeMO') return 'CHAdeMO'
  if (type.endsWith('Type_1')) return 'Type1'
  return 'Type2'
}

const initialState: OcppState = {
  items: {},
  order: [],
  selectedId: undefined,
}

/**
 * Returns the runtime connector, creating it when missing. Runtime connectors can lag behind the device
 * settings (e.g. the connector count was changed and persisted straight to storage), and dropping the
 * update silently left the UI stuck on connector 1.
 */
function ensureConnector(cp: ChargePoint | undefined, connectorId: number): Connector | undefined {
  if (!cp || !Number.isInteger(connectorId) || connectorId < 1) return undefined
  cp.runtime = cp.runtime || { connectors: [] }
  cp.runtime.connectors = cp.runtime.connectors || []
  let connector = cp.runtime.connectors.find(c => c.id === connectorId)
  if (!connector) {
    connector = { id: connectorId, status: 'Available' }
    cp.runtime.connectors.push(connector)
    cp.runtime.connectors.sort((a, b) => a.id - b.id)
  }
  return connector
}

const ocppSlice = createSlice({
  name: 'ocpp',
  initialState,
  reducers: {
    addChargePoint: {
      prepare(partial?: Partial<ChargePoint>) {
        const id = nanoid(8)
        const defaultDeviceSettings: DeviceSettings = normalizeDeviceSettings({
          deviceName: `Simulator-${id}`,
          ...(partial?.chargePointConfig?.deviceSettings || {}),
        })
        const defaultOcppConfig: OcppConfiguration = normalizeOcppConfiguration(
          partial?.chargePointConfig?.ocppConfig
        )
        const numConnectors = defaultDeviceSettings.connectors
        const connectors: Connector[] = Array.from({ length: numConnectors }, (_, i) => ({
          id: i + 1,
          status: 'Available' as const,
          idTag: i === 0 ? 'DEMO1234' : undefined, // default idTag for first connector
        }))
        return {
          payload: {
            id,
            label: partial?.label || `CP ${id}`,
            config: partial?.config || {
              csmsUrl: OCPP_GATEWAY_URL,
              cpId: `SIM_${id}`,
              protocol: 'ocpp1.6',
            },
            status: 'disconnected' as ConnectionStatus,
            paused: false,
            runtime: partial?.runtime || { connectors },
            chargePointConfig: {
              deviceSettings: defaultDeviceSettings,
              ocppConfig: defaultOcppConfig,
            },
          } as ChargePoint,
        }
      },
      reducer(state, action: PayloadAction<ChargePoint>) {
        state.items[action.payload.id] = action.payload
        state.order.unshift(action.payload.id)
        state.selectedId = action.payload.id
      },
    },
    importFromBackend: {
      prepare(cp: BackendChargePoint, org: OrgRef, zone: { id: string; name: string }) {
        const id = nanoid(8)
        const sorted = [...cp.connectors].sort((a, b) => a.connectorNumber - b.connectorNumber)
        const maxPower = Math.max(0, ...sorted.map((c) => c.maxPowerKw ?? 0))
        const deviceSettings: DeviceSettings = normalizeDeviceSettings({
          deviceName: cp.name,
          ...(cp.model ? { model: cp.model } : {}),
          connectors: sorted.length || 1,
          socketType: sorted.map((c) => toSocketType(c.type)),
          acdc: sorted.some((c) => c.currentType === 'DC') ? 'DC' : 'AC',
          ...(maxPower > 0 ? { maxPowerKw: maxPower } : {}),
        })
        const connectors: Connector[] = sorted.length
          ? sorted.map((c, i) => ({
              id: c.connectorNumber,
              status: 'Available' as const,
              idTag: i === 0 ? 'DEMO1234' : undefined,
            }))
          : [{ id: 1, status: 'Available' as const, idTag: 'DEMO1234' }]
        return {
          payload: {
            id,
            label: cp.name,
            config: { csmsUrl: OCPP_GATEWAY_URL, cpId: cp.evseId, protocol: 'ocpp1.6' as const },
            status: 'disconnected' as ConnectionStatus,
            paused: false,
            runtime: { connectors },
            chargePointConfig: {
              deviceSettings,
              ocppConfig: normalizeOcppConfiguration(undefined),
            },
            backend: {
              organizationId: org.id,
              organizationName: org.name,
              zoneId: zone.id,
              zoneName: zone.name,
              chargePointId: cp.id,
              evseId: cp.evseId,
            },
          } as ChargePoint,
        }
      },
      reducer(state, action: PayloadAction<ChargePoint>) {
        const existing = Object.values(state.items).find(
          (x) => x.backend?.chargePointId === action.payload.backend?.chargePointId
        )
        if (existing) {
          state.selectedId = existing.id
          return
        }
        state.items[action.payload.id] = action.payload
        state.order.unshift(action.payload.id)
        state.selectedId = action.payload.id
      },
    },
    renameChargePoint(state, action: PayloadAction<{ id: string; label: string }>) {
      const cp = state.items[action.payload.id]
      if (cp) cp.label = action.payload.label
    },
    removeChargePoint(state, action: PayloadAction<string>) {
      delete state.items[action.payload]
      state.order = state.order.filter((x) => x !== action.payload)
      if (state.selectedId === action.payload) state.selectedId = state.order[0]
    },
    selectChargePoint(state, action: PayloadAction<string | undefined>) {
      state.selectedId = action.payload
    },
    updateConfig(
      state,
      action: PayloadAction<{ id: string; patch: Partial<ConnectionConfig> }>
    ) {
      const cp = state.items[action.payload.id]
      if (cp) cp.config = { ...cp.config, ...action.payload.patch }
    },
    setStatus(state, action: PayloadAction<{ id: string; status: ConnectionStatus }>) {
      const cp = state.items[action.payload.id]
      if (cp) cp.status = action.payload.status
    },
    setPaused(state, action: PayloadAction<{ id: string; paused: boolean }>) {
      const cp = state.items[action.payload.id]
      if (cp) cp.paused = action.payload.paused
    },
    setConnectorId(state, action: PayloadAction<{ id: string; connectorId: number }>) {
      const cp = state.items[action.payload.id]
      if (cp) cp.runtime = { ...(cp.runtime || { connectors: [] }), activeConnectorId: action.payload.connectorId }
    },
    setIdTag(state, action: PayloadAction<{ id: string; connectorId: number; idTag: string }>) {
      const connector = ensureConnector(state.items[action.payload.id], action.payload.connectorId)
      if (connector) connector.idTag = action.payload.idTag
    },
    setTransactionId(state, action: PayloadAction<{ id: string; connectorId: number; transactionId?: number }>) {
      const connector = ensureConnector(state.items[action.payload.id], action.payload.connectorId)
      if (connector) connector.transactionId = action.payload.transactionId
    },
    updateConnectorStatus(state, action: PayloadAction<{ id: string; connectorId: number; status: Connector['status'] }>) {
      const connector = ensureConnector(state.items[action.payload.id], action.payload.connectorId)
      if (connector) connector.status = action.payload.status
    },
    updateConnector(state, action: PayloadAction<{ id: string; connectorId: number; updates: Partial<Connector> }>) {
      const connector = ensureConnector(state.items[action.payload.id], action.payload.connectorId)
      if (connector) Object.assign(connector, action.payload.updates)
    },
    updateDeviceSettings(state, action: PayloadAction<{ id: string; deviceSettings: Partial<DeviceSettings> }>) {
      const cp = state.items[action.payload.id]
      if (!cp) return
      if (!cp.chargePointConfig) {
        cp.chargePointConfig = {
          deviceSettings: normalizeDeviceSettings({}),
          ocppConfig: normalizeOcppConfiguration({}),
        }
      }
      const oldConnectors = cp.chargePointConfig.deviceSettings.connectors
      cp.chargePointConfig.deviceSettings = { ...cp.chargePointConfig.deviceSettings, ...action.payload.deviceSettings }
      const newConnectors = cp.chargePointConfig.deviceSettings.connectors
      if (newConnectors !== oldConnectors && cp.runtime?.connectors) {
        if (newConnectors > oldConnectors) {
          for (let i = oldConnectors + 1; i <= newConnectors; i++) {
            cp.runtime.connectors.push({
              id: i,
              status: 'Available',
            })
          }
        } else if (newConnectors < oldConnectors) {
          cp.runtime.connectors = cp.runtime.connectors.filter(c => c.id <= newConnectors)
        }
      }
    },
    updateOcppConfiguration(state, action: PayloadAction<{ id: string; ocppConfig: Partial<OcppConfiguration> }>) {
      const cp = state.items[action.payload.id]
      if (!cp) return
      if (!cp.chargePointConfig) {
        cp.chargePointConfig = {
          deviceSettings: normalizeDeviceSettings({}),
          ocppConfig: normalizeOcppConfiguration({}),
        }
      }
      cp.chargePointConfig.ocppConfig = { ...cp.chargePointConfig.ocppConfig, ...action.payload.ocppConfig }
    },
  },
})

export const {
  addChargePoint,
  importFromBackend,
  removeChargePoint,
  selectChargePoint,
  updateConfig,
  setStatus,
  setPaused,
  renameChargePoint,
  setConnectorId,
  setIdTag,
  setTransactionId,
  updateDeviceSettings,
  updateOcppConfiguration,
  updateConnectorStatus,
  updateConnector,
} = ocppSlice.actions

export default ocppSlice.reducer
