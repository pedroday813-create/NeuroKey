import type { UIMessage } from 'ai'

// Tipos de providers suportados
export type ProviderType = 'gemini' | 'openai'

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
  provider: ProviderType
  model: string
  temperature: number
  maxTokens: number
  theme: 'dark' | 'light' | 'system'
}

// Modelos disponiveis por provider
export const AVAILABLE_MODELS = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recomendado)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Recomendado)' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
} as const

// Informacoes dos providers
export const PROVIDERS = {
  gemini: {
    id: 'gemini' as const,
    name: 'Google Gemini',
    description: 'IA do Google, rapida e eficiente',
    apiKeyHint: 'Obtenha em: https://makersuite.google.com/app/apikey',
    envVar: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-flash',
  },
  openai: {
    id: 'openai' as const,
    name: 'OpenAI (ChatGPT)',
    description: 'IA da OpenAI, versátil e poderosa',
    apiKeyHint: 'Obtenha em: https://platform.openai.com/api-keys',
    envVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
  },
} as const

// Configuracoes padrao
export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
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

// Helper para obter modelo padrao do provider
export function getDefaultModel(provider: ProviderType): string {
  return PROVIDERS[provider].defaultModel
}

// Helper para validar se modelo pertence ao provider
export function isModelForProvider(model: string, provider: ProviderType): boolean {
  const models = AVAILABLE_MODELS[provider]
  return models.some(m => m.id === model)
}
