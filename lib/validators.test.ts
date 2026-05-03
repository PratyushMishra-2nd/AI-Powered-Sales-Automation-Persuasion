import { describe, it, expect } from 'vitest'
import { requireStr, requireNum, requireArr, requireOneOf, escHtml } from './validators'

describe('Validators', () => {
  describe('requireStr', () => {
    it('returns a string as is', () => {
      expect(requireStr('hello')).toBe('hello')
    })
    it('truncates strings that are too long', () => {
      expect(requireStr('hello world', 5)).toBe('hello')
    })
    it('returns empty string for non-strings', () => {
      expect(requireStr(123)).toBe('')
      expect(requireStr(null)).toBe('')
      expect(requireStr(undefined)).toBe('')
    })
  })

  describe('requireNum', () => {
    it('returns numbers correctly', () => {
      expect(requireNum(5, 0, 10)).toBe(5)
    })
    it('clamps to minimum', () => {
      expect(requireNum(-1, 0, 10)).toBe(0)
    })
    it('clamps to maximum', () => {
      expect(requireNum(11, 0, 10)).toBe(10)
    })
    it('handles non-numbers by returning min', () => {
      expect(requireNum('abc', 0, 10)).toBe(0)
    })
  })

  describe('requireArr', () => {
    it('returns array as is', () => {
      expect(requireArr([1, 2, 3])).toEqual([1, 2, 3])
    })
    it('returns empty array for non-arrays', () => {
      expect(requireArr('string')).toEqual([])
      expect(requireArr(null)).toEqual([])
    })
  })

  describe('requireOneOf', () => {
    it('returns the value if it is allowed', () => {
      expect(requireOneOf('apple', ['apple', 'banana'], 'banana')).toBe('apple')
    })
    it('returns fallback if value is not allowed', () => {
      expect(requireOneOf('orange', ['apple', 'banana'], 'banana')).toBe('banana')
    })
  })

  describe('escHtml', () => {
    it('escapes HTML characters', () => {
      expect(escHtml('<div>&</div>')).toBe('&lt;div&gt;&amp;&lt;/div&gt;')
    })
  })
})
