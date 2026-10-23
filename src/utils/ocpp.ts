import { CALL, CALLERROR, CALLRESULT } from '../types/ocpp';

/**
 * Construye la URL OCPP-J (WebSocket) del punto de carga.
 * Muchos CS (p. ej. ocpp-go) registran un único segmento de ruta: `ws://host:puerto/<chargePointId>`.
 * 8887 en este repo = CSMS OCPP (Go), no Centrifugo (9000). Si en "CSMS URL" se pone `ws://host:8887/ws`, el patrón antiguo producía `.../ws/CP-01` y el servidor no hace match.
 */
export function buildOcppWebSocketUrl(csmsUrl: string, cpId: string): string {
  const trimmed = csmsUrl.trim();
  if (!trimmed) throw new Error('URL required');
  const stationId = encodeURIComponent(cpId.trim() || 'SIM');

  const u = new URL(trimmed);
  let p = u.pathname.replace(/\/+$/, '');
  if (p === '') p = '/';

  if (p === '/' || p === '/ws') {
    u.pathname = `/${stationId}`;
    u.search = '';
    u.hash = '';
    return u.toString();
  }

  let base = trimmed;
  if (!base.endsWith('/')) base += '/';
  return new URL(base + stationId).toString();
}

export const formatNumber = (n: number): string => Number(n).toFixed(2);

export const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const parseOCPPFrame = (raw: any[]): { type: string; action: string; id: string } => {
  try {
    const [t, mid, third] = raw;
    if (t === CALL) {
      return { type: 'CALL', action: third, id: mid };
    } else if (t === CALLRESULT) {
      return { type: 'CALLRESULT', action: '(result)', id: mid };
    } else if (t === CALLERROR) {
      return { type: 'CALLERROR', action: third, id: mid };
    }
    return { type: '', action: '', id: '' };
  } catch {
    return { type: '', action: '', id: '' };
  }
};

export const createOCPPCall = (action: string, payload: any, id: string): any[] => {
  return [CALL, id, action, payload];
};

export const createOCPPResult = (id: string, payload: any): any[] => {
  return [CALLRESULT, id, payload || {}];
};

export const createOCPPError = (id: string, code: string, description: string, details: any): any[] => {
  return [CALLERROR, id, code, description || '', details || {}];
};
