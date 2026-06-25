export interface RetryOptions {
  max: number
  delays: number[] // ms between attempts; len = max - 1
  shouldRetry?: (err: unknown, attempt: number) => boolean
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const { max, delays, shouldRetry } = opts
  let lastErr: unknown
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      lastErr = err
      const canRetry = attempt < max - 1 && (shouldRetry ? shouldRetry(err, attempt) : true)
      if (!canRetry) break
      const wait = delays[attempt] ?? delays[delays.length - 1] ?? 1000
      await new Promise<void>((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}
