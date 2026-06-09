'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AppSettings, AIConnection } from '@/lib/types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/types'

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useSettings() {
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

  // Atualiza campos gerais (temperatura, tokens, prompt, tema)
  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      persist((prev) => ({ ...prev, ...updates }))
    },
    [persist],
  )

  // Adiciona uma nova conexao (e a ativa automaticamente)
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

  // Atualiza uma conexao existente
  const updateConnection = useCallback(
    (id: string, updates: Partial<Omit<AIConnection, 'id'>>) => {
      persist((prev) => ({
        ...prev,
        connections: prev.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }))
    },
    [persist],
  )

  // Remove uma conexao
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

  // Define a conexao ativa
  const setActiveConnection = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, activeConnectionId: id }))
    },
    [persist],
  )

  return {
    settings,
    isLoaded,
    updateSettings,
    addConnection,
    updateConnection,
    removeConnection,
    setActiveConnection,
  }
}
