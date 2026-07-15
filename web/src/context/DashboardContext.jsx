// Central data provider: fetches the parsed workbook once, polls for
// changes, and exposes { data, loading, error, refresh } to the whole app.
// This is the single source of truth the entire dashboard reads from -
// every module (boards, players, tournaments, fixtures, ...) is derived
// from this one payload straight out of the Excel workbook.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const DashboardContext = createContext(null)

const POLL_INTERVAL_MS = 15000

export function DashboardProvider({ children }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const generatedAtRef = useRef(null)

  const fetchData = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/dashboard${force ? '?refresh=1' : ''}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server responded ${res.status}`)
      }
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      generatedAtRef.current = json.generatedAt
      setData(json)
      setError(null)
    } catch (e) {
      setError(e.message || 'Failed to load IOCF workbook')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(() => fetchData(), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  return (
    <DashboardContext.Provider value={{ data, error, loading, refresh }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
