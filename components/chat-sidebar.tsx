"use client"

import { Plus, Menu, X } from "lucide-react"
import { NexoLogo } from "./nexo-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewConversation: () => void
}

export function ChatSidebar({
  isOpen,
  onToggle,
  onNewConversation,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <NexoLogo size={28} />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onToggle}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-3">
          <Button
            onClick={onNewConversation}
            className="w-full justify-start gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border border-sidebar-border"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>

        {/* Placeholder for future conversation list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
            Conversas recentes
          </p>
          <p className="text-sm text-muted-foreground px-2 py-4 text-center">
            Nenhuma conversa ainda
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            Desenvolvido por Pedro Rodrigues Cruz
          </p>
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden bg-card/80 backdrop-blur-sm border border-border"
        onClick={onToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  )
}
