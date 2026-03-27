import api from './axios'
import type { TaxReport } from '../types'

export const taxApi = {
  async list() {
    const res = await api.get<TaxReport[]>('/tax-reports')
    return res.data
  },

  async get(id: number) {
    const res = await api.get<TaxReport>(`/tax-reports/${id}`)
    return res.data
  },

  async generate(year: number) {
    const res = await api.post<TaxReport>(`/tax-reports/generate/${year}`)
    return res.data
  },

  exportCsvUrl(id: number) {
    return `/api/v1/tax-reports/${id}/export/csv`
  },

  exportPdfUrl(id: number) {
    return `/api/v1/tax-reports/${id}/export/pdf`
  },
}
