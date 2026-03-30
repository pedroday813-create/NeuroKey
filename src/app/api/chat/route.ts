import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 60

// Providers suportados
type ProviderType = 'gemini' | 'openai'

// Configuracoes padrao por provider
const PROVIDER_DEFAULTS: Record<ProviderType, { model: string; prefix: string }> = {
  gemini: {
    model: 'gemini-2.5-flash',
    prefix: 'google/',
  },
  openai: {
    model: 'gpt-4o-mini',
    prefix: 'openai/',
  },
}

const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 4096

const SYSTEM_PROMPT = `Voce e o MindDriveAI, um assistente de IA inteligente, amigavel e prestativo.

Suas caracteristicas:
- Responde em portugues brasileiro de forma clara e natural
- E prestativo, preciso e direto ao ponto
- Explica conceitos complexos de forma simples quando necessario
- Admite quando nao sabe algo em vez de inventar
- E criativo e pode ajudar com diversas tarefas como escrita, codigo, analises, etc.

Sempre responda de forma util e engajada.`

// Lista de modelos disponiveis por provider
export const AVAILABLE_MODELS = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
}

function getFullModelId(provider: ProviderType, modelId: string): string {
  const prefix = PROVIDER_DEFAULTS[provider].prefix
  // Se ja tem o prefixo, retorna como esta
  if (modelId.includes('/')) {
    return modelId
  }
  return `${prefix}${modelId}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      messages, 
      provider = 'gemini' as ProviderType,
      model,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
    }: { 
      messages: UIMessage[]
      provider?: ProviderType
      model?: string
      temperature?: number
      maxTokens?: number
    } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Mensagens sao obrigatorias' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validar provider
    if (!['gemini', 'openai'].includes(provider)) {
      return new Response(
        JSON.stringify({ error: 'Provider invalido. Use "gemini" ou "openai".' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Determinar modelo a usar
    const providerDefaults = PROVIDER_DEFAULTS[provider]
    const modelToUse = model || providerDefaults.model
    const fullModelId = getFullModelId(provider, modelToUse)

    const result = streamText({
      model: fullModelId,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature,
      maxOutputTokens: maxTokens,
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ isAborted }) => {
        if (isAborted) {
          console.log('[MindDriveAI] Geracao abortada pelo usuario')
        }
      },
      consumeSseStream: consumeStream,
    })
  } catch (error) {
    console.error('[MindDriveAI] Erro na API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorLower = errorMessage.toLowerCase()
    
    // Diagnosticar tipo de erro
    let userFriendlyMessage = 'Erro ao processar sua mensagem'
    let statusCode = 500
    
    if (errorLower.includes('401') || errorLower.includes('api key') || errorLower.includes('invalid')) {
      userFriendlyMessage = 'API key invalida. Verifique suas configuracoes.'
      statusCode = 401
    } else if (errorLower.includes('403') || errorLower.includes('permission')) {
      userFriendlyMessage = 'Sem permissao para acessar a API. Verifique sua conta.'
      statusCode = 403
    } else if (errorLower.includes('429') || errorLower.includes('rate limit')) {
      userFriendlyMessage = 'Limite de requisicoes excedido. Aguarde um momento.'
      statusCode = 429
    } else if (errorLower.includes('402') || errorLower.includes('billing') || errorLower.includes('quota')) {
      userFriendlyMessage = 'Creditos insuficientes. Verifique sua conta.'
      statusCode = 402
    } else if (errorLower.includes('connection') || errorLower.includes('network')) {
      userFriendlyMessage = 'Erro de conexao. Verifique sua internet.'
      statusCode = 503
    } else if (errorLower.includes('safety') || errorLower.includes('blocked')) {
      userFriendlyMessage = 'Conteudo bloqueado por politica de seguranca.'
      statusCode = 400
    }
    
    return new Response(
      JSON.stringify({ 
        error: userFriendlyMessage,
        details: errorMessage 
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
