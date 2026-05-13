import { describe, it, expect } from 'vitest'
import { toAPIStatus, toUIStatus, isValidAPISatus } from '@/lib/statusUtils'

describe('statusUtils', () => {
  describe('toAPIStatus', () => {
    it('converts eating to eating', () => {
      expect(toAPIStatus('eating')).toBe('eating')
    })

    it('converts not-eating to not_eating', () => {
      expect(toAPIStatus('not-eating')).toBe('not_eating')
    })
  })

  describe('toUIStatus', () => {
    it('converts eating to eating', () => {
      expect(toUIStatus('eating')).toBe('eating')
    })

    it('converts not_eating to not-eating', () => {
      expect(toUIStatus('not_eating')).toBe('not-eating')
    })
  })

  describe('isValidAPISatus', () => {
    it('returns true for eating', () => {
      expect(isValidAPISatus('eating')).toBe(true)
    })

    it('returns true for not_eating', () => {
      expect(isValidAPISatus('not_eating')).toBe(true)
    })

    it('returns false for not-eating (UI format)', () => {
      expect(isValidAPISatus('not-eating')).toBe(false)
    })

    it('returns false for invalid status', () => {
      expect(isValidAPISatus('invalid')).toBe(false)
    })
  })
})
