import { useState, useEffect, useCallback } from 'react'
import { budgetSummaryApi } from '../api/budget'
import type { BudgetSummary } from '../types/budget'

export function useBudget() {
  const now = new Date()
  const [month, setMonth]       = useState(now.getMonth() + 1)
  const [year, setYear]         = useState(now.getFullYear())
  const [summary, setSummary]   = useState<BudgetSummary | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await budgetSummaryApi.getSummary(month, year)
      setSummary(data)
    } catch {
      setError('Impossible de charger le résumé budgétaire')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const prevMonth = useCallback(() => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }, [month])

  return { month, year, summary, isLoading, error, prevMonth, nextMonth, reload: load }
}
