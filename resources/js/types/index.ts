export interface User {
  id: number
  name: string
  email: string
  currency: string
  locale: string
  timezone: string
}

export interface AssetCategory {
  id: number
  name: string
  slug: string
  type: 'asset' | 'liability'
  icon: string
  color: string
  is_system: boolean
  sort_order: number
}

export interface Platform {
  id: number
  user_id: number
  name: string
  type: string | null
  website: string | null
  notes: string | null
  is_active: boolean
  assets_count?: number
}

export interface AssetMeta {
  // Compte bancaire
  iban_masked?: string
  account_type?: string
  // Crypto
  token?: string
  quantity?: number
  average_buy_price?: number
  wallet?: string
  // SCPI
  shares_count?: number
  share_price?: number
  management_company?: string
  distributed_income?: number
  // Titres/PEA
  isin?: string
  shares?: number
  average_price?: number
  dividends?: number
  // Immobilier
  address?: string
  area_sqm?: number
  rent_monthly?: number
  charges_monthly?: number
  // Crowdlending
  rate?: number
  capital_remaining?: number
  interests_received?: number
  [key: string]: unknown
}

export interface Attachment {
  id: number
  original_name: string
  mime_type: string | null
  size: number | null
  notes: string | null
  created_at: string
}

export interface Asset {
  id: number
  name: string
  description?: string
  currency: string
  current_value: number
  initial_value?: number
  acquisition_date?: string
  last_updated_at?: string
  status: 'active' | 'closed' | 'pending'
  update_frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual'
  estimated_yield?: number
  notes?: string
  meta?: AssetMeta
  is_liability: boolean
  is_overdue: boolean
  gain_loss: number
  gain_loss_percent: number
  sort_order: number
  created_at: string
  category?: AssetCategory
  platform?: Platform
  loan?: Loan
  valuations?: AssetValuation[]
  income_entries?: IncomeEntry[]
  attachments?: Attachment[]
}

export interface AssetValuation {
  id: number
  asset_id: number
  value: number
  currency: string
  recorded_at: string
  source: 'manual' | 'import' | 'automatic'
  notes?: string
}

export interface Loan {
  id: number
  asset_id: number
  lender_name?: string
  borrowed_amount: number
  remaining_capital: number
  interest_rate: number
  monthly_payment?: number
  start_date?: string
  end_date?: string
  loan_type: 'mortgage' | 'consumer' | 'personal' | 'crowdlending' | 'other'
  currency: string
}

export type IncomeType = 'interest' | 'dividend' | 'rental' | 'capital_gain' | 'scpi' | 'crowdlending' | 'crypto' | 'other'

export interface IncomeEntry {
  id: number
  user_id: number
  asset_id?: number
  income_type: IncomeType
  amount: number
  currency: string
  fiscal_year: number
  received_at: string
  is_taxable: boolean
  tax_category?: string
  notes?: string
  asset?: Pick<Asset, 'id' | 'name'>
}

export interface TaxReport {
  id: number
  user_id: number
  fiscal_year: number
  status: 'draft' | 'final'
  data?: TaxReportData
  notes?: string
  generated_at?: string
  exported_at?: string
}

export interface TaxReportData {
  fiscal_year: number
  user_name: string
  generated_at: string
  disclaimer: string
  summary: {
    total_income: number
    total_taxable: number
    by_type: Record<string, {
      count: number
      total: number
      taxable: number
      non_taxable: number
      entries: TaxEntry[]
    }>
  }
  tax_lines: TaxLine[]
  entries_count: number
}

export interface TaxEntry {
  id: number
  asset_name: string
  income_type: string
  label: string
  amount: number
  currency: string
  received_at: string
  is_taxable: boolean
  tax_category?: string
  notes?: string
}

export interface TaxLine {
  box: string
  label: string
  amount: number
  note?: string
}

export interface Reminder {
  id: number
  user_id: number
  asset_id?: number
  title: string
  message?: string
  due_date: string
  frequency: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  is_active: boolean
  last_triggered_at?: string
  next_due_at?: string
  asset?: Pick<Asset, 'id' | 'name' | 'category'>
}

export interface DashboardData {
  total_assets: number
  total_liabilities: number
  net_worth: number
  initial_invested: number
  global_yield: number
  monthly_variation: { previous: number; current: number; diff: number; percent: number }
  yearly_variation: { previous: number; current: number; diff: number; percent: number }
  allocation_category: AllocationItem[]
  allocation_platform: AllocationItem[]
  allocation_currency: CurrencyAllocation[]
  income_current_year: number
  overdue_assets: number
}

export interface AllocationItem {
  name: string
  value: number
  percent: number
  color?: string
  count: number
}

export interface CurrencyAllocation {
  currency: string
  value: number
  percent: number
  count: number
}

export interface MonthlyChartPoint {
  month: string
  label: string
  net_worth: number
  assets: number
  liabilities: number
}

export interface YearlyChartPoint {
  year: number
  net_worth: number
  assets: number
  liabilities: number
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// --- Projections ---

export interface CategoryProjectionRate {
  growth_rate: number
  monthly_savings: number
}

export interface ProjectionSettings {
  horizon_years: number
  target_age: number | null
  current_age: number | null
  inflation_rate: number
  category_rates: Record<string, CategoryProjectionRate>
}

export interface ProjectionDataPoint {
  year: number
  total: number
  breakdown: Record<string, number>
}

export interface ProjectionResult {
  current_value: number
  projected_value: number
  data_points: ProjectionDataPoint[]
  cumulative_savings: number
  inflation_adjusted: boolean
}

export interface ProjectionCategory {
  id: number
  name: string
  color: string
  icon: string
}

export interface ProjectionSettingsResponse {
  settings: ProjectionSettings | null
  categories: ProjectionCategory[]
}
