import { useState, useCallback } from 'react'
import { expensesApi } from '../api/budget'
import type { Expense } from '../types/budget'

export function useExpenses(month: number, year: number) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await expensesApi.list({ month, year })
      setExpenses(res.data)
    } catch {
      setError('Impossible de charger les dépenses')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  const createExpense = useCallback(async (data: {
    expense_category_id: number
    amount: number
    currency?: string
    description: string
    date: string
    notes?: string
  }) => {
    const expense = await expensesApi.create(data)
    setExpenses(prev => [expense, ...prev])
    return expense
  }, [])

  const deleteExpense = useCallback(async (id: number) => {
    await expensesApi.delete(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  return { expenses, isLoading, error, load, createExpense, deleteExpense }
}
