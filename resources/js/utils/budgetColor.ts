interface BudgetColorResult {
  bar: string
  text: string
}

export function budgetColor(rate: number | null): BudgetColorResult {
  if (rate === null || rate < 80) return { bar: 'bg-green-500', text: 'text-green-600' }
  if (rate < 100)                  return { bar: 'bg-orange-500', text: 'text-orange-500' }
  return                                  { bar: 'bg-red-500', text: 'text-red-600' }
}
