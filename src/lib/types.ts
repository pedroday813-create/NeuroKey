import type { UIMessage } from 'ai'

/**
 * MindDriveAI - Sistema universal de IA
 *
 * Em vez de suportar apenas providers especificos (OpenAI, Gemini),
 * usamos o padrao "OpenAI-compatible": qualquer IA que exponha um
 * endpoint compativel com a API da OpenAI pode ser usada informando
 * apenas tres coisas: URL base, API key e nome do modelo.
 *
 * Isso cobre: OpenAI, Groq, Mistral, DeepSeek, OpenRouter, Together,
 * xAI (Grok), Perplexity, Fireworks, Google Gemini (endpoint OpenAI),
 * Ollama (local), LM Studio (local) e qualquer endpoint customizado.
 */

// Conexao com um provedor de IA configurada pelo usuario
export interface AIConnection {
  id: string
  /** Nome amigavel dado pelo usuario (ex: "Meu OpenAI", "Groq trabalho") */
  label: string
  /** URL base do endpoint compativel com OpenAI (termina em /v1) */
  baseURL: string
  /** Chave de API do provedor (armazenada apenas localmente no navegador) */
  apiKey: string
  /** Nome do modelo a ser usado (ex: "gpt-4o-mini", "llama-3.3-70b-versatile") */
  model: string
  /** Preset usado para criar essa conexao (apenas referencia visual) */
  presetId?: string
}

// Conversa salva localmente
export interface Conversation {
  id: string
  title: string
  messages: UIMessage[]
  createdAt: number
  updatedAt: number
}

// Configuracoes gerais do app
export interface AppSettings {
  /** ID da conexao de IA ativa */
  activeConnectionId: string | null
  /** Lista de conexoes configuradas pelo usuario */
  connections: AIConnection[]
  temperature: number
  maxTokens: number
  systemPrompt: string
  theme: 'dark' | 'light' | 'system'
}

// Configuracoes padrao
export const DEFAULT_SYSTEM_PROMPT = `Voce e o MindDriveAI, um assistente de IA inteligente, amigavel e prestativo.

Suas caracteristicas:
- Responde em portugues brasileiro de forma clara e natural
- E prestativo, preciso e direto ao ponto
- Explica conceitos complexos de forma simples quando necessario
- Admite quando nao sabe algo em vez de inventar
- E criativo e pode ajudar com diversas tarefas como escrita, codigo, analises, etc.

Sempre responda de forma util e engajada.`

export const DEFAULT_SETTINGS: AppSettings = {
  activeConnectionId: null,
  connections: [],
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  theme: 'dark',
}

// Chaves do localStorage
export const STORAGE_KEYS = {
  CONVERSATIONS: 'minddriveai_conversations',
  SETTINGS: 'minddriveai_settings',
  CURRENT_CONVERSATION: 'minddriveai_current_conversation',
} as const

// Helper para obter a conexao ativa
export function getActiveConnection(settings: AppSettings): AIConnection | null {
  if (!settings.activeConnectionId) return null
  return settings.connections.find((c) => c.id === settings.activeConnectionId) ?? null
}
