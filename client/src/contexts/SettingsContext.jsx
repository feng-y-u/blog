import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSettings } from '../api/settings'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    setError(null)
    getSettings().then(res => setSettings(res.data.data)).catch(e => setError(e.message))
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <SettingsContext.Provider value={{ settings, error, reload }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
