import { expect, it } from 'vitest'
import { fetchMospi } from './mospi-http.js'
import { MOSPI_URL } from './mospi.js'

it('restricts the compatibility setting to the public MoSPI endpoint', async () => {
  for (const url of ['http://api.mospi.gov.in/api/plfs/getData', 'https://example.com/api/plfs/getData',
    'https://api.mospi.gov.in/private', 'https://user:pass@api.mospi.gov.in/api/plfs/getData']) {
    await expect(fetchMospi(url)).rejects.toThrow(/endpoint/)
  }
  await expect(fetchMospi(MOSPI_URL, { method: 'POST' })).rejects.toThrow(/endpoint/)
})
