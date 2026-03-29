'use client'

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  model?: string
}

export function ChatInput({ onSendMessage, disabled, model }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus no input
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  const handleSubmit = () => {
    if (!message.trim() || disabled) return
    onSendMessage(message.trim())
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  // Conta caracteres
  const charCount = message.length
  const showCharCount = charCount > 0

  // Nome do modelo formatado
  const modelName = model?.split('/').pop()?.replace(/-/g, ' ') || 'IA'

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-md p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className="flex items-end gap-2 bg-card rounded-2xl border border-border p-2 shadow-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Escreva sua mensagem..."
              disabled={disabled}
              rows={1}
              className={cn(
                "flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0",
                "text-foreground placeholder:text-muted-foreground",
                "min-h-[44px] max-h-[200px] py-3 px-3",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-sm leading-relaxed"
              )}
              aria-label="Digite sua mensagem"
            />

            <Button
              type="button"
              size="icon"
              className={cn(
                "flex-shrink-0 rounded-xl h-10 w-10 transition-all duration-200",
                message.trim()
                  ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              onClick={handleSubmit}
              disabled={disabled || !message.trim()}
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Character count */}
          {showCharCount && (
            <div className="absolute -top-6 right-2 text-xs text-muted-foreground">
              {charCount.toLocaleString()} caracteres
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span className="capitalize">{modelName}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            MindDriveAI pode cometer erros. Verifique informacoes importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
