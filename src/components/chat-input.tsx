"use client"

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!message.trim() || disabled) return
    onSendMessage(message)
    setMessage("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-card rounded-2xl border border-border p-2">
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
              "min-h-[40px] max-h-[200px] py-2 px-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          <Button
            type="button"
            size="icon"
            className={cn(
              "flex-shrink-0 rounded-xl transition-all duration-200",
              message.trim()
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "bg-muted text-muted-foreground"
            )}
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Nexo pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  )
}
