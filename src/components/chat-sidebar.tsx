'use client'

import { useState } from 'react'
import { 
  Plus, 
  Menu, 
  X, 
  MessageSquare, 
  Trash2, 
  Download,
  Pencil,
  Settings,
  MoreHorizontal,
  Check
} from 'lucide-react'
import { MindDriveAILogo } from './minddriveai-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/types'

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewConversation: () => void
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  onExportConversation: (id: string) => void
  onOpenSettings: () => void
  activeConnectionLabel: string | null
}

export function ChatSidebar({
  isOpen,
  onToggle,
  onNewConversation,
  conversations,
  currentConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onExportConversation,
  onOpenSettings,
  activeConnectionLabel,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditingTitle(conv.title)
  }

  const handleSaveRename = () => {
    if (editingId && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDeleteConversation(deleteTargetId)
    }
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days} dias atras`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

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
          <MindDriveAILogo size={28} />
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
            className="w-full justify-start gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
            Conversas recentes
          </p>
          
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-4 text-center">
              Nenhuma conversa ainda
            </p>
          ) : (
            <div className="space-y-1 pb-4">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                    currentConversationId === conv.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename()
                          if (e.key === 'Escape') handleCancelRename()
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleSaveRename}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectConversation(conv.id)}
                        className="flex-1 text-left truncate"
                      >
                        <span className="truncate block">{conv.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleStartRename(conv)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onExportConversation(conv.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(conv.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <button
            onClick={onOpenSettings}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
              'hover:bg-sidebar-accent',
            )}
          >
            <span
              className={cn(
                'flex-shrink-0 h-2 w-2 rounded-full',
                activeConnectionLabel ? 'bg-accent' : 'bg-muted-foreground/50',
              )}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {activeConnectionLabel ?? 'Nenhuma IA conectada'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {activeConnectionLabel ? 'Conectado' : 'Toque para configurar'}
              </p>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
          <p className="text-xs text-muted-foreground text-center px-2">
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A conversa sera permanentemente excluida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
