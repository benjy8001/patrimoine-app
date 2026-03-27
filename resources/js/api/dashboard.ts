import api from './axios'
import type { DashboardData, MonthlyChartPoint, YearlyChartPoint } from '../types'

export const dashboardApi = {
  async get() {
    const res = await api.get<DashboardData>('/dashboard')
    return res.data
  },

  async monthlyChart(months = 12) {
    const res = await api.get<MonthlyChartPoint[]>('/dashboard/chart/monthly', { params: { months } })
    return res.data
  },

  async yearlyChart(years = 5) {
    const res = await api.get<YearlyChartPoint[]>('/dashboard/chart/yearly', { params: { years } })
    return res.data
  },
}
