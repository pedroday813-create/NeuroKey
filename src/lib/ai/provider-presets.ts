import type { LucideIcon } from 'lucide-react'
import {
  Sparkles,
  Zap,
  Bot,
  Brain,
  Cloud,
  Cpu,
  Server,
  Wind,
  Flame,
  Compass,
} from 'lucide-react'

/**
 * Presets de provedores compativeis com a API da OpenAI.
 *
 * Um preset NAO trava o usuario a um provedor: ele apenas pre-preenche
 * a URL base e sugere modelos populares. O usuario pode editar tudo,
 * inclusive escolher "Personalizado" e digitar qualquer URL.
 */

export interface ProviderPreset {
  id: string
  name: string
  description: string
  /** URL base do endpoint compativel com OpenAI */
  baseURL: string
  /** Modelos sugeridos (o usuario pode digitar qualquer outro) */
  suggestedModels: string[]
  /** Onde obter a API key */
  apiKeyUrl?: string
  /** Se true, a URL base e editavel (provedores locais / customizados) */
  editableBaseURL: boolean
  icon: LucideIcon
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'GPT-4o, GPT-4, GPT-3.5 e modelos o1',
    baseURL: 'https://api.openai.com/v1',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini'],
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    editableBaseURL: false,
    icon: Sparkles,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.5 / 2.0 / 1.5 via endpoint OpenAI',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    editableBaseURL: false,
    icon: Brain,
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Inferencia ultra-rapida (Llama, Mixtral)',
    baseURL: 'https://api.groq.com/openai/v1',
    suggestedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    apiKeyUrl: 'https://console.groq.com/keys',
    editableBaseURL: false,
    icon: Zap,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat e Reasoner (custo baixo)',
    baseURL: 'https://api.deepseek.com/v1',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    editableBaseURL: false,
    icon: Compass,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large, Small e Codestral',
    baseURL: 'https://api.mistral.ai/v1',
    suggestedModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    editableBaseURL: false,
    icon: Wind,
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Modelos Grok da xAI',
    baseURL: 'https://api.x.ai/v1',
    suggestedModels: ['grok-2-latest', 'grok-2-vision-latest', 'grok-beta'],
    apiKeyUrl: 'https://console.x.ai',
    editableBaseURL: false,
    icon: Bot,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Centenas de modelos de varios provedores',
    baseURL: 'https://openrouter.ai/api/v1',
    suggestedModels: [
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-2.0-flash-exp',
      'meta-llama/llama-3.3-70b-instruct',
    ],
    apiKeyUrl: 'https://openrouter.ai/keys',
    editableBaseURL: false,
    icon: Cloud,
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Modelos open-source hospedados',
    baseURL: 'https://api.together.xyz/v1',
    suggestedModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    editableBaseURL: false,
    icon: Flame,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Modelos rodando na sua maquina',
    baseURL: 'http://localhost:11434/v1',
    suggestedModels: ['llama3.2', 'qwen2.5', 'mistral', 'phi4'],
    editableBaseURL: true,
    icon: Server,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Servidor local do LM Studio',
    baseURL: 'http://localhost:1234/v1',
    suggestedModels: ['local-model'],
    editableBaseURL: true,
    icon: Cpu,
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Qualquer endpoint compativel com OpenAI',
    baseURL: '',
    suggestedModels: [],
    editableBaseURL: true,
    icon: Cpu,
  },
]

export function getPreset(id: string | undefined): ProviderPreset | undefined {
  if (!id) return undefined
  return PROVIDER_PRESETS.find((p) => p.id === id)
}
