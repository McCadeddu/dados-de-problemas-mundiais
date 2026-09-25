import { constants } from 'node:crypto'
import { get } from 'node:https'

/** The public MoSPI server lacks secure-renegotiation signalling (September 2026).
 * Permit its initial handshake only, keeping certificate/hostname verification
 * and TLS >= 1.2; disable renegotiation. Never apply this to other hosts or redirects.
 */
export const fetchMospi: typeof fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input))
  if (url.origin !== 'https://api.mospi.gov.in' || url.pathname !== '/api/plfs/getData'
    || url.username || url.password || (init?.method && init.method !== 'GET') || init?.body) {
    throw new Error('MoSPI: requisição fora do endpoint público autorizado')
  }
  return new Promise<Response>((resolve, reject) => {
    const request = get(url, {
      agent: false, minVersion: 'TLSv1.2', rejectUnauthorized: true,
      secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT | constants.SSL_OP_NO_RENEGOTIATION,
      signal: init?.signal ?? undefined,
      headers: { Accept: 'application/json', 'User-Agent': 'Mundialidade-open-source-dashboard/1.0' },
    }, (response) => {
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > 2_000_000) { response.destroy(new Error('MoSPI: resposta excessivamente grande')); return }
        chunks.push(chunk)
      })
      response.on('error', reject)
      response.on('end', () => {
        const status = response.statusCode ?? 502
        resolve(new Response([204, 205, 304].includes(status) ? null : Buffer.concat(chunks).toString('utf8'), { status }))
      })
    })
    request.on('error', (error) => {
      if (error.name === 'AbortError') reject(error)
      else reject(new TypeError('MoSPI: falha HTTPS', { cause: error }))
    })
  })
}
