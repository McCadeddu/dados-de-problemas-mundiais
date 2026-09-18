import { describe, expect, it, vi } from 'vitest'
import { withCachedFallback } from './resilience.js'

describe('withCachedFallback', () => {
  it('keeps fresh data when the source is available', async () => {
    await expect(withCachedFallback(async () => 'fresh', async () => 'cached', vi.fn(), 'INPE')).resolves.toBe('fresh')
  })

  it('uses cached data when the source fails', async () => {
    const warning = vi.fn()
    await expect(withCachedFallback(async () => { throw new Error('timeout') }, async () => 'cached', warning, 'INPE')).resolves.toBe('cached')
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('timeout'))
  })
})
