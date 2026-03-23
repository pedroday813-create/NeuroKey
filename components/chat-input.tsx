"use client"

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react"
import { Send, Paperclip, Image, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Attachment {
  type: "image" | "file"
  name: string
  url?: string
  file: File
}

interface ChatInputProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return
    onSendMessage(message, attachments)
    setMessage("")
    setAttachments([])
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
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const handleFileSelect = (
    e: ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      type,
      name: file.name,
      url: type === "image" ? URL.createObjectURL(file) : undefined,
      file,
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    e.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev]
      if (newAttachments[index].url) {
        URL.revokeObjectURL(newAttachments[index].url!)
      }
      newAttachments.splice(index, 1)
      return newAttachments
    })
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
      <div className="max-w-3xl mx-auto">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group bg-card rounded-lg border border-border overflow-hidden"
              >
                {attachment.type === "image" && attachment.url ? (
                  <div className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="px-3 py-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate max-w-[100px]">
                      {attachment.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-2 bg-card rounded-2xl border border-border p-2">
          {/* File attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "file")}
          />

          {/* Image attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="h-5 w-5" />
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "image")}
          />

          {/* Textarea */}
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

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            className={cn(
              "flex-shrink-0 rounded-xl transition-all duration-200",
              message.trim() || attachments.length > 0
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "bg-muted text-muted-foreground"
            )}
            onClick={handleSubmit}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
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
