'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { AppSettings, AIConnection } from '@/lib/types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/types'

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

interface SettingsContextValue {
  settings: AppSettings
  isLoaded: boolean
  updateSettings: (updates: Partial<AppSettings>) => void
  addConnection: (connection: Omit<AIConnection, 'id'>) => string
  updateConnection: (id: string, updates: Partial<Omit<AIConnection, 'id'>>) => void
  removeConnection: (id: string) => void
  setActiveConnection: (id: string) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carrega configuracoes do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('[MindDriveAI] Erro ao carregar configuracoes:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persiste no localStorage e atualiza estado
  const persist = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const updated = updater(prev)
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
      } catch (error) {
        console.error('[MindDriveAI] Erro ao salvar configuracoes:', error)
      }
      return updated
    })
  }, [])

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      persist((prev) => ({ ...prev, ...updates }))
    },
    [persist],
  )

  const addConnection = useCallback(
    (connection: Omit<AIConnection, 'id'>): string => {
      const id = generateId()
      persist((prev) => ({
        ...prev,
        connections: [...prev.connections, { ...connection, id }],
        activeConnectionId: id,
      }))
      return id
    },
    [persist],
  )

  const updateConnection = useCallback(
    (id: string, updates: Partial<Omit<AIConnection, 'id'>>) => {
      persist((prev) => ({
        ...prev,
        connections: prev.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }))
    },
    [persist],
  )

  const removeConnection = useCallback(
    (id: string) => {
      persist((prev) => {
        const connections = prev.connections.filter((c) => c.id !== id)
        const activeConnectionId =
          prev.activeConnectionId === id
            ? (connections[0]?.id ?? null)
            : prev.activeConnectionId
        return { ...prev, connections, activeConnectionId }
      })
    },
    [persist],
  )

  const setActiveConnection = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, activeConnectionId: id }))
    },
    [persist],
  )

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        updateSettings,
        addConnection,
        updateConnection,
        removeConnection,
        setActiveConnection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider')
  }
  return ctx
}
