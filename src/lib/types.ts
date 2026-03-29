import type { UIMessage } from 'ai'

// Conversa salva localmente
export interface Conversation {
  id: string
  title: string
  messages: UIMessage[]
  createdAt: number
  updatedAt: number
}

// Configuracoes do app
export interface AppSettings {
  model: string
  temperature: number
  maxTokens: number
  theme: 'dark' | 'light' | 'system'
}

// Modelos disponiveis
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic' },
] as const

// Configuracoes padrao
export const DEFAULT_SETTINGS: AppSettings = {
  model: 'google/gemini-2.0-flash',
  temperature: 0.7,
  maxTokens: 4096,
  theme: 'dark',
}

// Chaves do localStorage
export const STORAGE_KEYS = {
  CONVERSATIONS: 'minddriveai_conversations',
  SETTINGS: 'minddriveai_settings',
  CURRENT_CONVERSATION: 'minddriveai_current_conversation',
} as const
