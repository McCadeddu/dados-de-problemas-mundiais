import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJsonWithRetry, fetchTextWithRetry } from './http.js'

const url = 'https://servicodados.ibge.gov.br/example'
afterEach(() => vi.useRealTimers())

describe('data HTTP retries', () => {
  it('retries a CSV service failure without parsing the successful body as JSON', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('unavailable', { status: 500 }))
      .mockResolvedValueOnce(new Response('period,value\r\n2026-07,5.778043'))
    const result = fetchTextWithRetry(url, { fetcher, onRetry: vi.fn() })
    await vi.advanceTimersByTimeAsync(2000)
    await expect(result).resolves.toBe('period,value\r\n2026-07,5.778043')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('recovers from the IBGE connection timeout and preserves real zero/null values', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }))
      .mockResolvedValueOnce(Response.json({ values: [0, null, 4.5] }))
    const onRetry = vi.fn()
    const result = fetchJsonWithRetry(url, { fetcher, onRetry })
    await vi.advanceTimersByTimeAsync(2000)
    await expect(result).resolves.toEqual({ values: [0, null, 4.5] })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledWith(expect.stringContaining('UND_ERR_CONNECT_TIMEOUT'))
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([408, 429, 500, 502, 503, 504])('retries HTTP %s at most three times and identifies the failed URL', async (status) => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response('unavailable', { status }))
    const result = fetchJsonWithRetry(url, { fetcher, onRetry: vi.fn() })
    const assertion = expect(result).rejects.toThrow(`3 tentativa(s): ${url}: HTTP ${status}`)
    await vi.advanceTimersByTimeAsync(6000)
    await assertion
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([400, 401, 403, 404])('does not retry permanent HTTP %s', async (status) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status }))
    await expect(fetchJsonWithRetry(url, { fetcher })).rejects.toThrow(`HTTP ${status}`)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not retry malformed JSON as though it were a network outage', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>error</html>'))
    await expect(fetchJsonWithRetry(url, { fetcher })).rejects.toThrow(url)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('keeps the timeout active while reading the body, then uses a fresh signal to retry', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      const signal = init!.signal as AbortSignal
      signals.push(signal)
      if (signals.length > 1) return Response.json({ ok: true })
      return new Response(new ReadableStream({ start(stream) {
        signal.addEventListener('abort', () => stream.error(new DOMException('timeout', 'AbortError')))
      } }))
    })
    const result = fetchJsonWithRetry(url, { fetcher, timeoutMs: 100, onRetry: vi.fn() })
    const assertion = expect(result).resolves.toEqual({ ok: true })
    await vi.advanceTimersByTimeAsync(2100)
    await assertion
    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})
