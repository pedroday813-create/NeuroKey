'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '@/lib/types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/types'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carrega configuracoes do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('[MindDriveAI] Erro ao carregar configuracoes:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Salva configuracoes
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
      } catch (error) {
        console.error('[MindDriveAI] Erro ao salvar configuracoes:', error)
      }
      return updated
    })
  }, [])

  // Reseta para padrao
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
    } catch (error) {
      console.error('[MindDriveAI] Erro ao resetar configuracoes:', error)
    }
  }, [])

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
  }
}
