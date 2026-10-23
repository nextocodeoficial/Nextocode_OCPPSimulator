import { describe, expect, it } from 'vitest';

import { parseStartTransactionResult } from './transaction';

describe('parseStartTransactionResult', () => {
  it('accepts a confirmation with Accepted status and a numeric transactionId', () => {
    expect(parseStartTransactionResult({ transactionId: 42, idTagInfo: { status: 'Accepted' } })).toEqual({
      accepted: true,
      transactionId: 42,
      status: 'Accepted',
    });
  });

  it('rejects when the CSMS answers Invalid, even if a transactionId is present', () => {
    expect(parseStartTransactionResult({ transactionId: 0, idTagInfo: { status: 'Invalid' } })).toEqual({
      accepted: false,
      transactionId: undefined,
      status: 'Invalid',
    });
  });

  it.each(['Blocked', 'Expired', 'ConcurrentTx'])('rejects %s', status => {
    expect(parseStartTransactionResult({ transactionId: 7, idTagInfo: { status } }).accepted).toBe(false);
  });

  it('rejects an Accepted confirmation without a numeric transactionId instead of inventing one', () => {
    expect(parseStartTransactionResult({ idTagInfo: { status: 'Accepted' } })).toEqual({
      accepted: false,
      transactionId: undefined,
      status: 'Accepted',
    });
  });

  it('treats a missing or malformed response as Unknown', () => {
    expect(parseStartTransactionResult(undefined)).toEqual({
      accepted: false,
      transactionId: undefined,
      status: 'Unknown',
    });
  });
});
