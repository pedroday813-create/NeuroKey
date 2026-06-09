import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { consumeStream, convertToModelMessages, streamText, type UIMessage } from 'ai'

export const maxDuration = 60

interface ChatRequestBody {
  messages: UIMessage[]
  /** URL base do endpoint compativel com OpenAI (vem do cliente) */
  baseURL?: string
  /** API key do usuario (vem do localStorage do cliente, nunca do servidor) */
  apiKey?: string
  /** Nome do modelo */
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

const DEFAULT_SYSTEM_PROMPT = `Voce e o MindDriveAI, um assistente de IA inteligente, amigavel e prestativo. Responda em portugues brasileiro de forma clara, precisa e util.`

/**
 * Diagnostica o erro e retorna mensagem amigavel + status apropriado.
 */
function diagnoseError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error)
  const lower = raw.toLowerCase()

  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('incorrect api key')) {
    return { message: 'API key invalida ou ausente. Verifique a chave nas configuracoes.', status: 401 }
  }
  if (lower.includes('403') || lower.includes('permission') || lower.includes('forbidden')) {
    return { message: 'Sem permissao para acessar este modelo ou provedor.', status: 403 }
  }
  if (lower.includes('404') || lower.includes('not found') || lower.includes('does not exist')) {
    return { message: 'Modelo ou endpoint nao encontrado. Verifique o nome do modelo e a URL base.', status: 404 }
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota')) {
    return { message: 'Limite de requisicoes excedido. Aguarde um momento e tente novamente.', status: 429 }
  }
  if (lower.includes('402') || lower.includes('billing') || lower.includes('insufficient')) {
    return { message: 'Creditos insuficientes na conta do provedor.', status: 402 }
  }
  if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('network') || lower.includes('enotfound')) {
    return { message: 'Nao foi possivel conectar ao provedor. Verifique a URL base e sua conexao (provedores locais precisam estar rodando).', status: 503 }
  }
  return { message: raw || 'Erro ao processar a mensagem.', status: 500 }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody
    const {
      messages,
      baseURL,
      apiKey,
      model,
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
    } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Mensagens sao obrigatorias.' }, { status: 400 })
    }
    if (!baseURL || !baseURL.trim()) {
      return Response.json(
        { error: 'URL base nao configurada. Adicione uma conexao de IA nas configuracoes.' },
        { status: 400 },
      )
    }
    if (!model || !model.trim()) {
      return Response.json(
        { error: 'Modelo nao configurado. Informe o nome do modelo nas configuracoes.' },
        { status: 400 },
      )
    }

    // Cria o provider universal compativel com OpenAI.
    // A apiKey vem do cliente (localStorage), nunca fica embutida no codigo.
    const provider = createOpenAICompatible({
      name: 'minddriveai',
      baseURL: baseURL.trim(),
      apiKey: apiKey?.trim() || 'no-key-required',
    })

    const result = streamText({
      model: provider(model.trim()),
      system: systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature,
      maxOutputTokens: maxTokens,
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError: (error) => {
        const { message } = diagnoseError(error)
        return message
      },
      consumeSseStream: consumeStream,
    })
  } catch (error) {
    console.error('[MindDriveAI] Erro na API:', error)
    const { message, status } = diagnoseError(error)
    return Response.json({ error: message }, { status })
  }
}
