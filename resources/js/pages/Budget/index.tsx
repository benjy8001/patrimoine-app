import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
import { useBudget } from '../../hooks/useBudget'
import { useExpenses } from '../../hooks/useExpenses'
import BudgetTable from './BudgetTable'
import ExpenseForm from './ExpenseForm'
import BudgetConfig from './BudgetConfig'
import BudgetChart from './BudgetChart'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { Card, CardHeader, CardTitle } from '../../components/shared/Card'
import { useQuery } from '../../hooks/useQuery'
import { expenseCategoriesApi } from '../../api/budget'
import { useAuthStore } from '../../stores/authStore'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type Tab = 'summary' | 'evolution'

export default function Budget() {
  const { user } = useAuthStore()
  const { month, year, summary, isLoading, error, prevMonth, nextMonth, reload } = useBudget()
  const { createExpense } = useExpenses(month, year)

  const [tab, setTab]                             = useState<Tab>('summary')
  const [showExpenseForm, setExpenseForm]         = useState(false)
  const [showBudgetConfig, setShowConfig]         = useState(false)

  const { data: categoriesData } = useQuery(['expense-categories'], () => expenseCategoriesApi.list())
  const categories = categoriesData ?? []

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  const handleAddExpense = async (data: Parameters<typeof createExpense>[0]) => {
    await createExpense(data)
    reload()
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Budget & Dépenses</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showBudgetConfig)}
            className="flex items-center gap-2 border border-border px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            <Settings className="w-4 h-4" /> Configurer les budgets
          </button>
          <button
            onClick={() => setExpenseForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter une dépense
          </button>
        </div>
      </div>

      {/* Budget Config (collapsible) */}
      {showBudgetConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration des budgets</CardTitle>
          </CardHeader>
          <BudgetConfig month={month} year={year} onUpdated={reload} />
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-border flex gap-0">
        <button className={tabClass('summary')} onClick={() => setTab('summary')}>
          Mois en cours
        </button>
        <button className={tabClass('evolution')} onClick={() => setTab('evolution')}>
          Évolution annuelle
        </button>
      </div>

      {tab === 'summary' && (
        <>
          {/* Navigateur mois */}
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium min-w-[160px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-accent transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {isLoading && <LoadingSpinner className="mt-10" />}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {!isLoading && summary && (
            <BudgetTable summary={summary} currency={user?.currency ?? 'EUR'} />
          )}
        </>
      )}

      {tab === 'evolution' && (
        <Card>
          <BudgetChart />
        </Card>
      )}

      {/* Modals */}
      <ExpenseForm
        open={showExpenseForm}
        onOpenChange={setExpenseForm}
        categories={categories}
        defaultDate={defaultDate}
        onSubmit={handleAddExpense}
      />
    </div>
  )
}
