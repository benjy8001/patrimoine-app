import api from './axios'
import type { AssetCategory } from '../types'

export const categoriesApi = {
  async list() {
    const res = await api.get<AssetCategory[]>('/asset-categories')
    return res.data
  },
}
