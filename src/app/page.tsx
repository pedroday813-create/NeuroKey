"use client"

import { useState } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatArea } from "@/components/chat-area"
import { ChatInput } from "@/components/chat-input"
import { WelcomeScreen } from "@/components/welcome-screen"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
    }
    setMessages((prev) => [...prev, userMessage])

    // TODO: Implemente sua IA aqui
    // Exemplo básico de resposta:
    setIsLoading(true)
    
    // Simula delay (remova quando conectar sua IA)
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "Olá! Sou o Nexo. Esta é uma resposta de exemplo - conecte sua IA aqui.",
      role: "assistant",
    }
    setMessages((prev) => [...prev, aiMessage])
    setIsLoading(false)
  }

  const handleNewConversation = () => {
    setMessages([])
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewConversation={handleNewConversation}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {messages.length > 0 ? (
          <ChatArea messages={messages} isLoading={isLoading} />
        ) : (
          <WelcomeScreen onSuggestionClick={handleSendMessage} />
        )}

        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  )
}
