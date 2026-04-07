import api from './axios'
import type {
  ProjectionSettings,
  ProjectionSettingsResponse,
  ProjectionResult,
} from '../types'

export const projectionsApi = {
  async getSettings(): Promise<ProjectionSettingsResponse> {
    const res = await api.get<ProjectionSettingsResponse>('/projections/settings')
    return res.data
  },

  async saveSettings(settings: ProjectionSettings): Promise<void> {
    await api.put('/projections/settings', settings)
  },

  async simulate(params: ProjectionSettings): Promise<ProjectionResult> {
    const res = await api.post<ProjectionResult>('/projections/simulate', params)
    return res.data
  },
}
