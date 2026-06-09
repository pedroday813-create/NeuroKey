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
import { getActiveConnection } from '@/lib/types'
import { toast } from 'sonner'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { settings, isLoaded: settingsLoaded } = useSettings()
  const activeConnection = getActiveConnection(settings)

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

  // Configuracao do chat com AI SDK (provider universal)
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          baseURL: activeConnection?.baseURL,
          apiKey: activeConnection?.apiKey,
          model: activeConnection?.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
        },
      }),
    }),
    onError: (error) => {
      console.error('[MindDriveAI] Erro no chat:', error)
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMsg)
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
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      // Bloqueia envio se nao houver conexao configurada
      if (!activeConnection) {
        toast.error('Conecte uma IA primeiro nas configuracoes.')
        setSettingsOpen(true)
        return
      }

      if (!currentConversationId) {
        createConversation()
      }

      sendMessage({ text: content })
    },
    [currentConversationId, createConversation, sendMessage, activeConnection],
  )

  const handleNewConversation = useCallback(() => {
    createConversation()
    setMessages([])
    setSidebarOpen(false)
  }, [createConversation, setMessages])

  const handleSelectConversation = useCallback(
    (id: string) => {
      selectConversation(id)
      setSidebarOpen(false)
    },
    [selectConversation],
  )

  const handleExportConversation = useCallback(
    (id: string) => {
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
    },
    [exportConversation],
  )

  const handleStopGeneration = useCallback(() => {
    stop()
    toast.info('Geracao interrompida')
  }, [stop])

  if (!conversationsLoaded || !settingsLoaded) {
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
        activeConnectionLabel={activeConnection?.label ?? null}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {messages.length > 0 ? (
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onStopGeneration={handleStopGeneration}
          />
        ) : (
          <WelcomeScreen
            onSuggestionClick={handleSendMessage}
            hasConnection={!!activeConnection}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          model={activeConnection?.model}
          connectionLabel={activeConnection?.label ?? null}
        />
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
