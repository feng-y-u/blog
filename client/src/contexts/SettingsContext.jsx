import { createContext, useContext, useState, useEffect } from 'react'
import { getSettings } from '../api/settings'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)

  function reload() {
    getSettings().then(res => setSettings(res.data.data)).catch(() => {})
  }

  useEffect(() => { reload() }, [])

  return (
    <SettingsContext.Provider value={{ settings, reload }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
