import { describe, it, expect } from 'vitest'
import { budgetColor } from './budgetColor'

describe('budgetColor', () => {
  it('returns green when rate is null (no budget set)', () => {
    expect(budgetColor(null).bar).toBe('bg-green-500')
  })

  it('returns green when rate is below 80%', () => {
    expect(budgetColor(50).bar).toBe('bg-green-500')
    expect(budgetColor(79.9).bar).toBe('bg-green-500')
  })

  it('returns orange when rate is between 80% and 99%', () => {
    expect(budgetColor(80).bar).toBe('bg-orange-500')
    expect(budgetColor(99.9).bar).toBe('bg-orange-500')
  })

  it('returns red when rate is 100% or more', () => {
    expect(budgetColor(100).bar).toBe('bg-red-500')
    expect(budgetColor(150).bar).toBe('bg-red-500')
  })

  it('returns correct text color with bar color', () => {
    expect(budgetColor(50).text).toBe('text-green-600')
    expect(budgetColor(90).text).toBe('text-orange-500')
    expect(budgetColor(110).text).toBe('text-red-600')
  })
})
