import api from './axios'

export interface ImportPreviewRow {
  row: number
  is_valid: boolean
  data: {
    name?: string
    category_name?: string
    platform_name?: string
    currency?: string
    current_value?: number
    initial_value?: number
    estimated_yield?: number
    acquisition_date?: string
    status?: string
    is_liability?: boolean
    notes?: string
  }
  errors: string[]
  warnings: string[]
}

export interface ImportError {
  row: number
  field: string
  message: string
}

export interface ImportPreviewResult {
  total_rows: number
  valid_rows: number
  error_rows: number
  will_create_platforms: string[]
  rows: ImportPreviewRow[]
  errors: ImportError[]
}

export interface ImportResult {
  imported: number
  skipped: number
  created_platforms: string[]
  message: string
}

function makeFormData(file: File): FormData {
  const form = new FormData()
  form.append('file', file)
  return form
}

export const importApi = {
  async preview(file: File): Promise<ImportPreviewResult> {
    const res = await api.post<ImportPreviewResult>('/assets/import/preview', makeFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async import(file: File): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/assets/import', makeFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
