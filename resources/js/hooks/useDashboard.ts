import { useQuery } from './useQuery'
import { dashboardApi } from '../api/dashboard'

export function useDashboard() {
  return useQuery(['dashboard'], () => dashboardApi.get(), { staleTime: 30_000 })
}

export function useMonthlyChart(months = 12) {
  return useQuery(['dashboard', 'monthly', months], () => dashboardApi.monthlyChart(months))
}

export function useYearlyChart(years = 5) {
  return useQuery(['dashboard', 'yearly', years], () => dashboardApi.yearlyChart(years))
}
