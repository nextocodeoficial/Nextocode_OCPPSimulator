type RawEnv = Record<string, string | undefined>

const pick = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed.replace(/\/+$/, '') : fallback
}

export function resolveEnv(raw: RawEnv) {
  return {
    BACKEND_API_URL: pick(raw.VITE_BACKEND_API_URL, 'http://localhost:3001'),
    // central-system-ocpp (Go) gateway; not Centrifugo (9000) nor the Nest API (3001).
    OCPP_GATEWAY_URL: pick(raw.VITE_OCPP_GATEWAY_URL, 'ws://localhost:8887'),
  }
}

export const { BACKEND_API_URL, OCPP_GATEWAY_URL } = resolveEnv(
  import.meta.env as unknown as RawEnv
)
