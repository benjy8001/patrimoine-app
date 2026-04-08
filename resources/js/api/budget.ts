import api from './axios'
import type {
  BudgetEvolution,
  BudgetSummary,
  Budget,
  Expense,
  ExpenseCategory,
  PaginatedExpenses,
} from '../types/budget'

export const expenseCategoriesApi = {
  async list(): Promise<ExpenseCategory[]> {
    const res = await api.get<ExpenseCategory[]>('/expense-categories')
    return res.data
  },
  async create(data: { name: string; color?: string; icon?: string }): Promise<ExpenseCategory> {
    const res = await api.post<ExpenseCategory>('/expense-categories', data)
    return res.data
  },
  async update(id: number, data: Partial<{ name: string; color: string; icon: string }>): Promise<ExpenseCategory> {
    const res = await api.put<ExpenseCategory>(`/expense-categories/${id}`, data)
    return res.data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/expense-categories/${id}`)
  },
}

export const expensesApi = {
  async list(params?: { month?: number; year?: number; category_id?: number }): Promise<PaginatedExpenses> {
    const res = await api.get<PaginatedExpenses>('/expenses', { params })
    return res.data
  },
  async create(data: {
    expense_category_id: number
    amount: number
    currency?: string
    description: string
    date: string
    notes?: string
  }): Promise<Expense> {
    const res = await api.post<Expense>('/expenses', data)
    return res.data
  },
  async update(id: number, data: Partial<{
    expense_category_id: number
    amount: number
    currency: string
    description: string
    date: string
    notes: string
  }>): Promise<Expense> {
    const res = await api.put<Expense>(`/expenses/${id}`, data)
    return res.data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`)
  },
}

export const budgetsApi = {
  async list(params?: { month?: number; year?: number }): Promise<Budget[]> {
    const res = await api.get<Budget[]>('/budgets', { params })
    return res.data
  },
  async upsert(data: {
    expense_category_id: number
    amount: number
    currency?: string
    month?: number | null
    year?: number | null
  }): Promise<Budget> {
    const res = await api.post<Budget>('/budgets', data)
    return res.data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`)
  },
}

export const budgetSummaryApi = {
  async getSummary(month: number, year: number): Promise<BudgetSummary> {
    const res = await api.get<BudgetSummary>('/budget/summary', { params: { month, year } })
    return res.data
  },
  async getEvolution(year: number): Promise<BudgetEvolution> {
    const res = await api.get<BudgetEvolution>('/budget/evolution', { params: { year } })
    return res.data
  },
}
