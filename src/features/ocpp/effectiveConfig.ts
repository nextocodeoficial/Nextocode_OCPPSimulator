import { normalizeDeviceSettings, normalizeOcppConfiguration } from '@/constants/chargePointDefaults';
import type { ChargePoint } from '@/features/ocpp/ocppSlice';
import type { DeviceSettings, OcppConfiguration } from '@/types/ocpp';
import { loadDeviceSettings, loadOcppConfiguration } from '@/features/ocpp/storage';

/**
 * Misma prioridad que en la vista de conexión: lo guardado en `ocpp:device:*` gana sobre el slice
 * para evitar desincronización si el persist del slice aún no escribió.
 */
export function getEffectiveDeviceSettings(cp: ChargePoint | undefined, id: string): DeviceSettings {
  const stored = loadDeviceSettings(id);
  return normalizeDeviceSettings({
    deviceName:
      stored?.deviceName ||
      cp?.chargePointConfig?.deviceSettings?.deviceName ||
      `Simulator-${id}`,
    ...(cp?.chargePointConfig?.deviceSettings || {}),
    ...(stored || {}),
  });
}

export function getEffectiveOcppConfiguration(cp: ChargePoint | undefined, id: string): OcppConfiguration {
  const stored = loadOcppConfiguration(id);
  return normalizeOcppConfiguration({
    ...(cp?.chargePointConfig?.ocppConfig || {}),
    ...(stored || {}),
  });
}
