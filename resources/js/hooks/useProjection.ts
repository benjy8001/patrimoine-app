import { useCallback, useEffect, useRef, useState } from 'react'
import { projectionsApi } from '../api/projections'
import type {
  CategoryProjectionRate,
  ProjectionCategory,
  ProjectionResult,
  ProjectionSettings,
} from '../types'

const DEFAULT_SETTINGS: ProjectionSettings = {
  horizon_years:  20,
  target_age:     null,
  current_age:    null,
  inflation_rate: 0,
  category_rates: {},
}

export function useProjection() {
  const [settings, setSettings]       = useState<ProjectionSettings>(DEFAULT_SETTINGS)
  const [categories, setCategories]   = useState<ProjectionCategory[]>([])
  const [result, setResult]           = useState<ProjectionResult | null>(null)
  const [isLoading, setIsLoading]     = useState(false)
  const [isSaving, setIsSaving]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initializedRef                = useRef(false)

  // Load saved settings and categories on mount
  useEffect(() => {
    projectionsApi.getSettings()
      .then(({ settings: saved, categories: cats }) => {
        setCategories(cats)
        if (saved) setSettings(saved)
        initializedRef.current = true
      })
      .catch(() => {
        initializedRef.current = true
        setError('Impossible de charger les paramètres')
      })
  }, [])

  // Auto-simulate on settings change (debounced 500ms)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!initializedRef.current) return
      let cancelled = false
      setIsLoading(true)
      setError(null)
      projectionsApi.simulate(settings)
        .then(res => { if (!cancelled) setResult(res) })
        .catch(() => { if (!cancelled) setError('Erreur lors de la simulation') })
        .finally(() => { if (!cancelled) setIsLoading(false) })
      return () => { cancelled = true }
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [settings])

  const saveSettings = useCallback(async () => {
    setIsSaving(true)
    try {
      await projectionsApi.saveSettings(settings)
    } catch {
      setError('Impossible de sauvegarder les paramètres')
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  const updateCategoryRate = useCallback((
    categoryId: number,
    field: keyof CategoryProjectionRate,
    value: number,
  ) => {
    setSettings(prev => ({
      ...prev,
      category_rates: {
        ...prev.category_rates,
        [String(categoryId)]: {
          growth_rate:     prev.category_rates[String(categoryId)]?.growth_rate     ?? 0,
          monthly_savings: prev.category_rates[String(categoryId)]?.monthly_savings ?? 0,
          [field]: value,
        },
      },
    }))
  }, [])

  const updateHorizon = useCallback((years: number) => {
    setSettings(prev => ({
      ...prev,
      horizon_years: years,
      target_age: prev.current_age != null ? prev.current_age + years : prev.target_age,
    }))
  }, [])

  const updateTargetAge = useCallback((age: number) => {
    setSettings(prev => ({
      ...prev,
      target_age: age,
      horizon_years: prev.current_age != null
        ? Math.max(1, age - prev.current_age)
        : prev.horizon_years,
    }))
  }, [])

  const updateInflation = useCallback((rate: number) => {
    setSettings(prev => ({ ...prev, inflation_rate: rate }))
  }, [])

  const updateCurrentAge = useCallback((age: number | null) => {
    setSettings(prev => {
      const updated = { ...prev, current_age: age }
      if (age != null) {
        updated.target_age = age + prev.horizon_years
      }
      return updated
    })
  }, [])

  return {
    settings,
    categories,
    result,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateCategoryRate,
    updateHorizon,
    updateTargetAge,
    updateInflation,
    updateCurrentAge,
  }
}
