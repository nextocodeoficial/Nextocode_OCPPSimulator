export interface StartTransactionResult {
  accepted: boolean;
  transactionId?: number;
  status: string;
}

/**
 * Interprets a StartTransaction.conf. The CSMS may reject the idTag (Invalid, Blocked, ...) and still
 * send a placeholder transactionId (usually 0); only Accepted with a numeric id starts a transaction.
 */
export function parseStartTransactionResult(res: unknown): StartTransactionResult {
  const body = (res ?? {}) as { transactionId?: unknown; idTagInfo?: { status?: unknown } };
  const status = typeof body.idTagInfo?.status === 'string' ? body.idTagInfo.status : 'Unknown';
  const accepted = status === 'Accepted' && typeof body.transactionId === 'number';
  return { accepted, transactionId: accepted ? (body.transactionId as number) : undefined, status };
}
