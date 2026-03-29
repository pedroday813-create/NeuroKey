'use client'

import { useRef, useEffect } from 'react'
import { Bot, User, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { UIMessage } from 'ai'

interface ChatAreaProps {
  messages: UIMessage[]
  isLoading?: boolean
  onStopGeneration?: () => void
}

// Helper para extrair texto de UIMessage
function getMessageText(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export function ChatArea({ messages, isLoading, onStopGeneration }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para nova mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => {
              const text = getMessageText(message)
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 animate-fade-in",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                      <Bot className="h-5 w-5 text-accent" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    )}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {text || (
                        <span className="text-muted-foreground italic">
                          Mensagem vazia
                        </span>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                  <div className="relative">
                    <Bot className="h-5 w-5 text-accent" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Stop generation button */}
      {isLoading && onStopGeneration && (
        <div className="flex justify-center py-3 border-t border-border bg-background/50 backdrop-blur-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={onStopGeneration}
            className="gap-2"
          >
            <Square className="h-3 w-3 fill-current" />
            Parar geracao
          </Button>
        </div>
      )}
    </div>
  )
}
