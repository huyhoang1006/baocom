import { describe, it, expect } from 'vitest'
import { generateUsername, generatePassword, generateUniqueUsername } from '@/lib/utils'

describe('generateUsername', () => {
  it('should generate username from full name', () => {
    expect(generateUsername('Phạm Xuân Hùng')).toBe('hungpx')
    expect(generateUsername('Nguyễn Văn A')).toBe('anv')
  })

  it('should handle single name', () => {
    expect(generateUsername('Trần')).toBe('tran')
  })

  it('should remove diacritics', () => {
    expect(generateUsername('Đặng Văn Minh')).toBe('minhdv')
  })
})

describe('generatePassword', () => {
  it('should generate password with default length', () => {
    const password = generatePassword()
    expect(password.length).toBe(8)
  })

  it('should generate password with custom length', () => {
    const password = generatePassword(12)
    expect(password.length).toBe(12)
  })

  it('should only contain lowercase letters and numbers', () => {
    const password = generatePassword(100)
    expect(password).toMatch(/^[a-z0-9]+$/)
  })
})

describe('generateUniqueUsername', () => {
  it('should return base username if not exists', () => {
    expect(generateUniqueUsername('hungpx', [])).toBe('hungpx')
  })

  it('should append counter if username exists', () => {
    expect(generateUniqueUsername('hungpx', ['hungpx'])).toBe('hungpx2')
    expect(generateUniqueUsername('hungpx', ['hungpx', 'hungpx2'])).toBe('hungpx3')
  })

  it('should find correct counter', () => {
    expect(generateUniqueUsername('hungpx', ['hungpx', 'hungpx2', 'hungpx4'])).toBe('hungpx3')
  })
})