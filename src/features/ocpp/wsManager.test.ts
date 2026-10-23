import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callAction, connectWs, disconnectWs, heartbeatPeriodSec } from './wsManager'

class FakeWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  static instances: FakeWebSocket[] = []

  readyState = FakeWebSocket.CONNECTING
  sent: unknown[][] = []
  onopen: (() => void) | null = null
  onclose: ((ev: { code: number; reason: string }) => void) | null = null
  onerror: ((ev: unknown) => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null

  constructor(
    public url: string,
    public protocols?: string[]
  ) {
    FakeWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(JSON.parse(data))
  }

  close(code = 1000, reason = '') {
    if (this.readyState === FakeWebSocket.CLOSED) return
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.({ code, reason })
  }

  open() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }

  sentActions() {
    return this.sent.filter((f) => f[0] === 2).map((f) => f[2])
  }
}

const qc = () => new QueryClient()

describe('heartbeatPeriodSec', () => {
  it('keeps short configured intervals', () => {
    expect(heartbeatPeriodSec(30)).toBe(30)
  })

  it('caps long intervals below the usual 60s server idle timeout', () => {
    expect(heartbeatPeriodSec(60)).toBeLessThan(60)
    expect(heartbeatPeriodSec(600)).toBeLessThan(60)
  })

  it('falls back to a safe value when unset and never goes below 10s', () => {
    expect(heartbeatPeriodSec(undefined)).toBeLessThan(60)
    expect(heartbeatPeriodSec(1)).toBe(10)
  })
})

describe('wsManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    for (const id of ['cp-a', 'cp-b']) disconnectWs(id)
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('sends a heartbeat before a 60s idle timeout when HeartbeatInterval is 60', async () => {
    const p = connectWs('cp-a', 'ws://gw/A', 'ocpp1.6', qc())
    const ws = FakeWebSocket.instances[0]
    ws.open()
    await p

    vi.advanceTimersByTime(59_000)
    expect(ws.sentActions()).toContain('Heartbeat')
  })

  it('reconnecting the same charger closes the previous socket without tearing down the new one', async () => {
    const firstOnClose = vi.fn()
    const secondOnClose = vi.fn()
    void connectWs('cp-a', 'ws://gw/A', 'ocpp1.6', qc(), undefined, firstOnClose)
    const first = FakeWebSocket.instances[0]
    first.open()

    const p = connectWs('cp-a', 'ws://gw/A', 'ocpp1.6', qc(), undefined, secondOnClose)
    const second = FakeWebSocket.instances[1]
    expect(first.readyState).toBe(FakeWebSocket.CLOSED)
    second.open()
    await p

    expect(firstOnClose).not.toHaveBeenCalled()
    expect(secondOnClose).not.toHaveBeenCalled()
    void callAction('cp-a', 'Heartbeat', {})
    expect(second.sentActions()).toContain('Heartbeat')
  })

  it('a late close of a superseded socket does not disconnect the current one', async () => {
    const secondOnClose = vi.fn()
    void connectWs('cp-a', 'ws://gw/A', 'ocpp1.6', qc())
    const first = FakeWebSocket.instances[0]
    // Simulate the browser delivering the close event only after the new socket exists.
    const lateClose = first.onclose
    first.onclose = null

    const p = connectWs('cp-a', 'ws://gw/A', 'ocpp1.6', qc(), undefined, secondOnClose)
    const second = FakeWebSocket.instances[1]
    second.open()
    await p
    lateClose?.({ code: 1008, reason: 'a connection with this ID already exists' })

    expect(secondOnClose).not.toHaveBeenCalled()
    void callAction('cp-a', 'Heartbeat', {})
    expect(second.sentActions()).toContain('Heartbeat')
  })

  it('chargers stay independent when one of them disconnects', async () => {
    const onCloseB = vi.fn()
    const pa = connectWs('cp-a', 'ws://gw/A', 'ocpp1.6', qc())
    const pb = connectWs('cp-b', 'ws://gw/B', 'ocpp1.6', qc(), undefined, onCloseB)
    const [a, b] = FakeWebSocket.instances
    a.open()
    b.open()
    await Promise.all([pa, pb])

    a.close(1006, 'gone')

    expect(onCloseB).not.toHaveBeenCalled()
    vi.advanceTimersByTime(59_000)
    expect(b.sentActions()).toContain('Heartbeat')
  })
})
