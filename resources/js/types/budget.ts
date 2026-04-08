export interface ExpenseCategory {
  id: number
  user_id: number | null
  name: string
  icon: string | null
  color: string
  is_system: boolean
  order: number
}

export interface Expense {
  id: number
  user_id: number
  expense_category_id: number
  amount: string   // decimal string from Laravel
  currency: string
  description: string
  date: string
  notes: string | null
  category?: ExpenseCategory
  created_at: string
}

export interface Budget {
  id: number
  user_id: number
  expense_category_id: number
  amount: string   // decimal string from Laravel
  currency: string
  month: number | null
  year: number | null
  category?: ExpenseCategory
}

export interface BudgetCategoryRow {
  category: {
    id: number
    name: string
    color: string
    icon: string | null
    is_system: boolean
  }
  budget: number
  spent: number
  remaining: number
  rate: number | null
}

export interface BudgetSummary {
  month: number
  year: number
  currency: string
  total_budget: number
  total_spent: number
  total_remaining: number
  categories: BudgetCategoryRow[]
}

export interface BudgetEvolutionMonth {
  month: number
  total: number
  by_category: {
    category_id: number
    name: string
    color: string
    amount: number
  }[]
}

export interface BudgetEvolution {
  year: number
  currency: string
  months: BudgetEvolutionMonth[]
}

export interface PaginatedExpenses {
  data: Expense[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
