import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 60

// Configuracao padrao do modelo - pode ser sobrescrita via body
const DEFAULT_MODEL = 'google/gemini-2.0-flash'
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      messages, 
      model = DEFAULT_MODEL,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
    }: { 
      messages: UIMessage[]
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

    const result = streamText({
      model,
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
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar sua mensagem',
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
