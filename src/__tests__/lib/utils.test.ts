/**
 * Testy jednostkowe dla utility functions
 * Data: 2025-12-05
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('foo', 'bar')
      expect(result).toContain('foo')
      expect(result).toContain('bar')
    })

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz')
      expect(result).toContain('foo')
      expect(result).toContain('baz')
      expect(result).not.toContain('bar')
    })

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'], 'baz')
      expect(result).toContain('foo')
      expect(result).toContain('bar')
      expect(result).toContain('baz')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(typeof result).toBe('string')
    })

    it('should merge Tailwind classes correctly', () => {
      // cn uses twMerge which merges conflicting Tailwind classes
      const result = cn('p-4', 'p-6')
      // Should only contain p-6 (last one wins)
      expect(result).toContain('p-6')
      expect(result).not.toContain('p-4')
    })
  })
})

