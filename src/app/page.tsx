'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatArea } from '@/components/chat-area'
import { ChatInput } from '@/components/chat-input'
import { WelcomeScreen } from '@/components/welcome-screen'
import { SettingsDialog } from '@/components/settings-dialog'
import { useConversations } from '@/hooks/use-conversations'
import { useSettings } from '@/hooks/use-settings'
import { toast } from 'sonner'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const { settings } = useSettings()
  const {
    conversations,
    currentConversation,
    currentConversationId,
    isLoaded: conversationsLoaded,
    createConversation,
    selectConversation,
    updateConversationMessages,
    renameConversation,
    deleteConversation,
    exportConversation,
  } = useConversations()

  // Configuracao do chat com AI SDK
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          provider: settings.provider,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        },
      }),
    }),
    onError: (error) => {
      console.error('[MindDriveAI] Erro no chat:', error)
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro: ${errorMsg}`)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Sincroniza mensagens com a conversa atual
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      updateConversationMessages(currentConversationId, messages)
    }
  }, [messages, currentConversationId, updateConversationMessages])

  // Carrega mensagens quando muda de conversa
  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages)
    } else {
      setMessages([])
    }
  }, [currentConversationId, setMessages])

  // Funcao para enviar mensagem
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return
    
    // Se nao tem conversa atual, cria uma nova
    if (!currentConversationId) {
      createConversation()
    }
    
    sendMessage({ text: content })
  }, [currentConversationId, createConversation, sendMessage])

  // Nova conversa
  const handleNewConversation = useCallback(() => {
    createConversation()
    setMessages([])
    setSidebarOpen(false)
  }, [createConversation, setMessages])

  // Seleciona conversa
  const handleSelectConversation = useCallback((id: string) => {
    selectConversation(id)
    setSidebarOpen(false)
  }, [selectConversation])

  // Exporta conversa
  const handleExportConversation = useCallback((id: string) => {
    const content = exportConversation(id, 'md')
    if (!content) {
      toast.error('Erro ao exportar conversa')
      return
    }
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Conversa exportada com sucesso!')
  }, [exportConversation])

  // Para geracao
  const handleStopGeneration = useCallback(() => {
    stop()
    toast.info('Geracao interrompida')
  }, [stop])

  if (!conversationsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewConversation={handleNewConversation}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        onExportConversation={handleExportConversation}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {messages.length > 0 ? (
          <ChatArea 
            messages={messages} 
            isLoading={isLoading} 
            onStopGeneration={handleStopGeneration}
          />
        ) : (
          <WelcomeScreen onSuggestionClick={handleSendMessage} />
        )}

        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading}
          model={settings.model}
        />
      </main>

      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  )
}
