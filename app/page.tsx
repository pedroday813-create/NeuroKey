"use client"

import { useState, useEffect, useCallback } from "react"
import { ChatSidebar, type Conversation } from "@/components/chat-sidebar"
import { ChatArea, type Message } from "@/components/chat-area"
import { ChatInput } from "@/components/chat-input"
import { WelcomeScreen } from "@/components/welcome-screen"

// Simulated AI responses
const aiResponses = [
  "Entendi! Vou te ajudar com isso. Deixa eu pensar em algumas opções...",
  "Ótima pergunta! Aqui está o que posso te dizer sobre isso:",
  "Interessante! Vamos explorar esse tema juntos.",
  "Claro, posso ajudar com isso! Veja o que eu preparei:",
  "Excelente ideia! Aqui estão algumas sugestões que podem te ajudar:",
]

const getRandomResponse = () => {
  return aiResponses[Math.floor(Math.random() * aiResponses.length)]
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const STORAGE_KEY = "nexo-conversations"

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load conversations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setConversations(data.conversations.map((c: Conversation) => ({
          ...c,
          createdAt: new Date(c.createdAt)
        })))
        setMessages(data.messages)
        if (data.activeConversationId) {
          setActiveConversationId(data.activeConversationId)
        }
      } catch (e) {
        console.error("Failed to load conversations:", e)
      }
    }
  }, [])

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0 || Object.keys(messages).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        conversations,
        messages,
        activeConversationId
      }))
    }
  }, [conversations, messages, activeConversationId])

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "Nova conversa",
      createdAt: new Date(),
    }
    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)
    setMessages((prev) => ({ ...prev, [newConversation.id]: [] }))
    setSidebarOpen(false)
    return newConversation.id
  }, [])

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setSidebarOpen(false)
  }

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setMessages((prev) => {
      const newMessages = { ...prev }
      delete newMessages[id]
      return newMessages
    })
    if (activeConversationId === id) {
      setActiveConversationId(null)
    }
  }

  const handleSendMessage = async (
    content: string,
    attachments: { type: "image" | "file"; name: string; url?: string; file: File }[]
  ) => {
    let conversationId = activeConversationId

    // Create new conversation if none is active
    if (!conversationId) {
      conversationId = createNewConversation()
    }

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      attachments: attachments.map((a) => ({
        type: a.type,
        name: a.name,
        url: a.url,
      })),
    }

    // Add user message to conversation
    setMessages((prev) => ({
      ...prev,
      [conversationId!]: [...(prev[conversationId!] || []), userMessage],
    }))

    // Update conversation title if it's the first message
    const currentMessages = messages[conversationId] || []
    if (currentMessages.length === 0) {
      const title = content.slice(0, 40) + (content.length > 40 ? "..." : "")
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title } : c
        )
      )
    }

    // Simulate AI response
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    const aiMessage: Message = {
      id: generateId(),
      content: getRandomResponse() + "\n\nVocê disse: \"" + content + "\"\n\nIsso é uma demonstração da interface. Em uma implementação real, aqui estaria a resposta da IA conectada a um modelo de linguagem.",
      role: "assistant",
    }

    setMessages((prev) => ({
      ...prev,
      [conversationId!]: [...(prev[conversationId!] || []), aiMessage],
    }))
    setIsLoading(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, [])
  }

  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : []

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={createNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat area or welcome screen */}
        {activeConversationId && currentMessages.length > 0 ? (
          <ChatArea messages={currentMessages} />
        ) : (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        )}

        {/* Chat input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  )
}
