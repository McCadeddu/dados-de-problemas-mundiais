export async function withCachedFallback<T>(load: () => Promise<T>, fallback: () => Promise<T>, onFallback: (message: string) => void, sourceName: string) {
  try {
    return await load()
  } catch (error) {
    onFallback(`${sourceName} update failed; reusing cached data: ${error instanceof Error ? error.message : String(error)}`)
    return fallback()
  }
}
