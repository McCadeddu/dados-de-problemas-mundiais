type RetryOptions = {
  fetcher?: typeof fetch
  timeoutMs?: number
  onRetry?: (message: string) => void
  acceptLanguage?: string
}

class HttpError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

function errorDetail(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause as { code?: string; message?: string } | undefined
  return `${error.message}${cause ? ` (${cause.code ?? cause.message ?? 'erro de conexão'})` : ''}`
}

function isTransient(error: unknown) {
  if (error instanceof HttpError) return [408, 429, 500, 502, 503, 504].includes(error.status)
  // Fetch/DOM errors may originate in another realm and fail instanceof Error.
  return typeof error === 'object' && error !== null && 'name' in error
    && ['TypeError', 'AbortError', 'TimeoutError'].includes(String(error.name))
}

/** Retry transport failures, including an interrupted body; never retry a schema/JSON error. */
async function fetchWithRetry<T>(url: string, accept: string, read: (response: Response) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { fetcher = fetch, timeoutMs = 60000, onRetry = console.warn } = options
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let failure: unknown
    try {
      const response = await fetcher(url, {
        signal: controller.signal,
        headers: { Accept: accept, 'User-Agent': 'Mundialidade-open-source-dashboard/1.0',
          ...(options.acceptLanguage ? { 'Accept-Language': options.acceptLanguage } : {}) },
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw new HttpError(response.status)
      }
      return await read(response)
    } catch (error) {
      failure = error
      if (attempt === 3 || !isTransient(error)) {
        throw new Error(`Coleta falhou após ${attempt} tentativa(s): ${url}: ${errorDetail(error)}`, { cause: error })
      }
    } finally {
      clearTimeout(timer)
    }
    const delayMs = attempt * 2000
    onRetry(`Falha transitória na tentativa ${attempt}/3: ${url}: ${errorDetail(failure)}. Nova tentativa em ${delayMs / 1000}s.`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  throw new Error(`Coleta não concluída: ${url}`)
}

export function fetchJsonWithRetry<T>(url: string, options: RetryOptions = {}): Promise<T> {
  return fetchWithRetry(url, 'application/json', (response) => response.json() as Promise<T>, options)
}

export function fetchTextWithRetry(url: string, options: RetryOptions = {}): Promise<string> {
  return fetchWithRetry(url, 'text/csv', (response) => response.text(), options)
}
