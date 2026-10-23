type RawEnv = Record<string, string | undefined>

const pick = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed.replace(/\/+$/, '') : fallback
}

export function resolveEnv(raw: RawEnv) {
  return {
    // Optional CSMS URL pre-filled in the "New charge point" form; users can always type their own.
    DEFAULT_CSMS_URL: pick(raw.VITE_DEFAULT_CSMS_URL, ''),
  }
}

export const { DEFAULT_CSMS_URL } = resolveEnv(import.meta.env as unknown as RawEnv)
