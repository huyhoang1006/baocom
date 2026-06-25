import { describe, it, expect } from 'vitest'
import { classifyZaloError } from '@/lib/zalo/errors'

describe('classifyZaloError', () => {
  it('classifies code 120 (cookie expired) as expired, not retryable, 503', () => {
    const err = { code: 120, message: 'Cookie expired' }
    const result = classifyZaloError(err)
    expect(result.kind).toBe('expired')
    expect(result.retryable).toBe(false)
    expect(result.httpStatus).toBe(503)
    expect(result.userMessage).toContain('hết hạn')
  })

  it('classifies code 429 (rate-limit) as rate-limit, retryable, 429', () => {
    const err = { code: 429, message: 'Too many requests' }
    const result = classifyZaloError(err)
    expect(result.kind).toBe('rate-limit')
    expect(result.retryable).toBe(true)
    expect(result.httpStatus).toBe(429)
  })

  it('classifies code 500 (server error) as transient, retryable, 502', () => {
    const err = { code: 500, message: 'Internal server error' }
    const result = classifyZaloError(err)
    expect(result.kind).toBe('transient')
    expect(result.retryable).toBe(true)
    expect(result.httpStatus).toBe(502)
  })

  it('classifies ZaloApiLoginQRAborted as fatal', () => {
    const result = classifyZaloError(new Error('ZaloApiLoginQRAborted: aborted'))
    expect(result.kind).toBe('fatal')
    expect(result.retryable).toBe(false)
  })

  it('classifies unknown errors as unknown, not retryable, 500', () => {
    const result = classifyZaloError(new Error('something weird'))
    expect(result.kind).toBe('unknown')
    expect(result.retryable).toBe(false)
    expect(result.httpStatus).toBe(500)
  })
})
