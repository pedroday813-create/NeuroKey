'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UIMessage } from 'ai'
import type { Conversation } from '@/lib/types'
import { STORAGE_KEYS } from '@/lib/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function generateTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage || !firstUserMessage.parts) {
    return 'Nova conversa'
  }
  
  const textPart = firstUserMessage.parts.find(p => p.type === 'text')
  if (!textPart || textPart.type !== 'text') {
    return 'Nova conversa'
  }
  
  const text = textPart.text.trim()
  return text.length > 50 ? text.slice(0, 50) + '...' : text
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carrega conversas do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[]
        setConversations(parsed.sort((a, b) => b.updatedAt - a.updatedAt))
      }
      
      const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION)
      if (currentId) {
        setCurrentConversationId(currentId)
      }
    } catch (error) {
      console.error('[MindDriveAI] Erro ao carregar conversas:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Salva conversas no localStorage
  const saveConversations = useCallback((convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs))
    } catch (error) {
      console.error('[MindDriveAI] Erro ao salvar conversas:', error)
    }
  }, [])

  // Obtem a conversa atual
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null

  // Cria nova conversa
  const createConversation = useCallback((): string => {
    const newConv: Conversation = {
      id: generateId(),
      title: 'Nova conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    const updated = [newConv, ...conversations]
    setConversations(updated)
    setCurrentConversationId(newConv.id)
    saveConversations(updated)
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, newConv.id)
    
    return newConv.id
  }, [conversations, saveConversations])

  // Atualiza mensagens de uma conversa
  const updateConversationMessages = useCallback((conversationId: string, messages: UIMessage[]) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id !== conversationId) return conv
        
        const title = conv.messages.length === 0 && messages.length > 0
          ? generateTitle(messages)
          : conv.title
        
        return {
          ...conv,
          title,
          messages,
          updatedAt: Date.now(),
        }
      }).sort((a, b) => b.updatedAt - a.updatedAt)
      
      saveConversations(updated)
      return updated
    })
  }, [saveConversations])

  // Seleciona uma conversa
  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId)
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, conversationId)
  }, [])

  // Renomeia uma conversa
  const renameConversation = useCallback((conversationId: string, newTitle: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title: newTitle.trim() || 'Nova conversa', updatedAt: Date.now() }
          : conv
      )
      saveConversations(updated)
      return updated
    })
  }, [saveConversations])

  // Exclui uma conversa
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== conversationId)
      saveConversations(updated)
      
      if (currentConversationId === conversationId) {
        const nextConv = updated[0]
        if (nextConv) {
          setCurrentConversationId(nextConv.id)
          localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, nextConv.id)
        } else {
          setCurrentConversationId(null)
          localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION)
        }
      }
      
      return updated
    })
  }, [currentConversationId, saveConversations])

  // Exporta conversa como texto
  const exportConversation = useCallback((conversationId: string, format: 'txt' | 'md' = 'md'): string => {
    const conv = conversations.find(c => c.id === conversationId)
    if (!conv) return ''
    
    const lines: string[] = []
    
    if (format === 'md') {
      lines.push(`# ${conv.title}`)
      lines.push('')
      lines.push(`> Exportado em ${new Date().toLocaleString('pt-BR')}`)
      lines.push('')
      lines.push('---')
      lines.push('')
    } else {
      lines.push(conv.title)
      lines.push(`Exportado em ${new Date().toLocaleString('pt-BR')}`)
      lines.push('---')
      lines.push('')
    }
    
    for (const msg of conv.messages) {
      const role = msg.role === 'user' ? 'Usuario' : 'MindDriveAI'
      const textParts = msg.parts?.filter(p => p.type === 'text').map(p => p.type === 'text' ? p.text : '') || []
      const text = textParts.join('')
      
      if (format === 'md') {
        lines.push(`**${role}:**`)
        lines.push('')
        lines.push(text)
        lines.push('')
      } else {
        lines.push(`${role}:`)
        lines.push(text)
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }, [conversations])

  return {
    conversations,
    currentConversation,
    currentConversationId,
    isLoaded,
    createConversation,
    selectConversation,
    updateConversationMessages,
    renameConversation,
    deleteConversation,
    exportConversation,
  }
}
