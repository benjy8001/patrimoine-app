import { useCallback, useEffect, useRef, useState } from 'react'

interface QueryState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const cache = new Map<string, { data: unknown; ts: number }>()

export function useQuery<T>(
  key: (string | number)[],
  fetcher: () => Promise<T>,
  options?: { staleTime?: number; enabled?: boolean }
): QueryState<T> {
  const cacheKey = key.join('/')
  const { staleTime = 0, enabled = true } = options ?? {}
  const [state, setState] = useState<Omit<QueryState<T>, 'refetch'>>(() => {
    const cached = cache.get(cacheKey)
    if (cached && staleTime > 0 && Date.now() - cached.ts < staleTime) {
      return { data: cached.data as T, isLoading: false, error: null }
    }
    return { data: null, isLoading: enabled, error: null }
  })

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetcherRef.current()
      cache.set(cacheKey, { data, ts: Date.now() })
      setState({ data, isLoading: false, error: null })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setState(s => ({ ...s, isLoading: false, error: msg }))
    }
  }, [cacheKey])

  useEffect(() => {
    if (!enabled) return
    const cached = cache.get(cacheKey)
    if (cached && staleTime > 0 && Date.now() - cached.ts < staleTime) return
    run()
  }, [cacheKey, enabled, run, staleTime])

  return { ...state, refetch: run }
}
