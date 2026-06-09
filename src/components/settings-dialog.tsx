'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Info,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Sliders,
  Link2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettings } from '@/hooks/use-settings'
import { PROVIDER_PRESETS, getPreset, type ProviderPreset } from '@/lib/ai/provider-presets'
import type { AIConnection } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ConnectionDraft = {
  presetId: string
  label: string
  baseURL: string
  apiKey: string
  model: string
}

function emptyDraft(): ConnectionDraft {
  return { presetId: '', label: '', baseURL: '', apiKey: '', model: '' }
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    settings,
    updateSettings,
    addConnection,
    updateConnection,
    removeConnection,
    setActiveConnection,
  } = useSettings()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draft, setDraft] = useState<ConnectionDraft>(emptyDraft())
  const [showApiKey, setShowApiKey] = useState(false)

  // Parametros de geracao (local ate salvar)
  const [temperature, setTemperature] = useState(settings.temperature)
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens)
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt)

  useEffect(() => {
    if (open) {
      setTemperature(settings.temperature)
      setMaxTokens(settings.maxTokens)
      setSystemPrompt(settings.systemPrompt)
    }
  }, [open, settings.temperature, settings.maxTokens, settings.systemPrompt])

  const startCreate = () => {
    setDraft(emptyDraft())
    setIsCreating(true)
    setEditingId(null)
    setShowApiKey(false)
  }

  const startEdit = (conn: AIConnection) => {
    setDraft({
      presetId: conn.presetId ?? 'custom',
      label: conn.label,
      baseURL: conn.baseURL,
      apiKey: conn.apiKey,
      model: conn.model,
    })
    setEditingId(conn.id)
    setIsCreating(false)
    setShowApiKey(false)
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingId(null)
    setDraft(emptyDraft())
  }

  const applyPreset = (preset: ProviderPreset) => {
    setDraft((prev) => ({
      ...prev,
      presetId: preset.id,
      label: prev.label || preset.name,
      baseURL: preset.baseURL,
      model: preset.suggestedModels[0] ?? prev.model,
    }))
  }

  const saveDraft = () => {
    if (!draft.label.trim()) {
      toast.error('Informe um nome para a conexao.')
      return
    }
    if (!draft.baseURL.trim()) {
      toast.error('Informe a URL base do endpoint.')
      return
    }
    if (!draft.model.trim()) {
      toast.error('Informe o nome do modelo.')
      return
    }

    const payload = {
      label: draft.label.trim(),
      baseURL: draft.baseURL.trim(),
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim(),
      presetId: draft.presetId || 'custom',
    }

    if (editingId) {
      updateConnection(editingId, payload)
      toast.success('Conexao atualizada!')
    } else {
      addConnection(payload)
      toast.success('Conexao adicionada e ativada!')
    }
    cancelEdit()
  }

  const handleRemove = (id: string) => {
    removeConnection(id)
    toast.info('Conexao removida.')
    if (editingId === id) cancelEdit()
  }

  const saveGeneration = () => {
    updateSettings({ temperature, maxTokens, systemPrompt })
    toast.success('Preferencias salvas!')
  }

  const selectedPreset = getPreset(draft.presetId)
  const showForm = isCreating || editingId !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Configuracoes
          </DialogTitle>
          <DialogDescription>
            Conecte qualquer IA compativel com OpenAI e ajuste o comportamento do MindDriveAI.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connections" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Conexoes
            </TabsTrigger>
            <TabsTrigger value="generation" className="gap-1.5">
              <Sliders className="h-4 w-4" />
              Geracao
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5">
              <Info className="h-4 w-4" />
              Sobre
            </TabsTrigger>
          </TabsList>

          {/* ===== CONEXOES ===== */}
          <TabsContent value="connections" className="space-y-4 mt-4">
            {!showForm && (
              <>
                {settings.connections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed border-border">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                      <KeyRound className="h-6 w-6 text-accent" />
                    </div>
                    <p className="font-medium text-foreground mb-1">Nenhuma IA conectada</p>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                      Adicione sua propria chave de API de qualquer provedor compativel com OpenAI.
                    </p>
                    <Button onClick={startCreate} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar conexao
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {settings.connections.map((conn) => {
                        const preset = getPreset(conn.presetId)
                        const Icon = preset?.icon ?? KeyRound
                        const isActive = settings.activeConnectionId === conn.id
                        return (
                          <div
                            key={conn.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border transition-all',
                              isActive
                                ? 'border-accent bg-accent/5'
                                : 'border-border hover:border-accent/40',
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveConnection(conn.id)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div
                                className={cn(
                                  'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                                  isActive ? 'bg-accent/15' : 'bg-muted',
                                )}
                              >
                                <Icon className="h-4 w-4 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {conn.label}
                                  </p>
                                  {isActive && (
                                    <span className="text-[10px] font-medium bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                                      ATIVA
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate font-mono">
                                  {conn.model}
                                </p>
                              </div>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEdit(conn)}
                                aria-label="Editar conexao"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemove(conn.id)}
                                aria-label="Remover conexao"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button onClick={startCreate} variant="outline" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar outra conexao
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Formulario de criacao/edicao */}
            {showForm && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {editingId ? 'Editar conexao' : 'Nova conexao'}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Presets */}
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDER_PRESETS.map((preset) => {
                      const Icon = preset.icon
                      const selected = draft.presetId === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={cn(
                            'flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all',
                            selected
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:border-accent/40',
                          )}
                        >
                          <Icon className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{preset.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Nome */}
                <div className="space-y-1.5">
                  <Label htmlFor="conn-label">Nome da conexao</Label>
                  <Input
                    id="conn-label"
                    value={draft.label}
                    onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Ex: Meu OpenAI"
                  />
                </div>

                {/* URL base */}
                <div className="space-y-1.5">
                  <Label htmlFor="conn-url">URL base</Label>
                  <Input
                    id="conn-url"
                    value={draft.baseURL}
                    onChange={(e) => setDraft((p) => ({ ...p, baseURL: e.target.value }))}
                    placeholder="https://api.exemplo.com/v1"
                    disabled={selectedPreset ? !selectedPreset.editableBaseURL : false}
                    className="font-mono text-xs"
                  />
                  {selectedPreset && !selectedPreset.editableBaseURL && (
                    <p className="text-[11px] text-muted-foreground">
                      URL definida pelo provedor. Escolha &quot;Personalizado&quot; para editar.
                    </p>
                  )}
                </div>

                {/* API key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="conn-key">Chave de API</Label>
                    {selectedPreset?.apiKeyUrl && (
                      <a
                        href={selectedPreset.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-accent hover:underline flex items-center gap-1"
                      >
                        Obter chave <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="conn-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={draft.apiKey}
                      onChange={(e) => setDraft((p) => ({ ...p, apiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="font-mono text-xs pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showApiKey ? 'Ocultar chave' : 'Mostrar chave'}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sua chave fica salva apenas neste navegador (localStorage). Deixe vazio para provedores locais.
                  </p>
                </div>

                {/* Modelo */}
                <div className="space-y-1.5">
                  <Label htmlFor="conn-model">Modelo</Label>
                  <Input
                    id="conn-model"
                    value={draft.model}
                    onChange={(e) => setDraft((p) => ({ ...p, model: e.target.value }))}
                    placeholder="Ex: gpt-4o-mini"
                    className="font-mono text-xs"
                  />
                  {selectedPreset && selectedPreset.suggestedModels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedPreset.suggestedModels.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDraft((p) => ({ ...p, model: m }))}
                          className={cn(
                            'text-[11px] px-2 py-1 rounded-md border font-mono transition-colors',
                            draft.model === m
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border text-muted-foreground hover:border-accent/40',
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                  <Button onClick={saveDraft} className="gap-2">
                    <Check className="h-4 w-4" />
                    {editingId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===== GERACAO ===== */}
          <TabsContent value="generation" className="space-y-6 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperatura</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature"
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Valores baixos = respostas focadas. Valores altos = mais criativas.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxTokens">Tokens maximos</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {maxTokens.toLocaleString()}
                </span>
              </div>
              <Slider
                id="maxTokens"
                value={[maxTokens]}
                onValueChange={([v]) => setMaxTokens(v)}
                min={256}
                max={16384}
                step={256}
              />
              <p className="text-xs text-muted-foreground">
                Limite maximo de tokens na resposta da IA.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="systemPrompt">Instrucao do sistema</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                className="text-sm resize-none"
                placeholder="Defina a personalidade e o comportamento da IA..."
              />
              <p className="text-xs text-muted-foreground">
                Define como a IA deve se comportar em todas as conversas.
              </p>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button onClick={saveGeneration}>Salvar preferencias</Button>
            </div>
          </TabsContent>

          {/* ===== SOBRE ===== */}
          <TabsContent value="about" className="space-y-4 mt-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
              <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">MindDriveAI</h4>
                <p className="text-sm text-muted-foreground">
                  Assistente de IA universal. Conecte qualquer provedor compativel com a API da
                  OpenAI usando sua propria chave.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Provedores compativeis</h4>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.filter((p) => p.id !== 'custom').map((p) => (
                  <span
                    key={p.id}
                    className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                  >
                    {p.name}
                  </span>
                ))}
                <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                  e qualquer outro compativel
                </span>
              </div>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              <p>Desenvolvido por Pedro Rodrigues Cruz</p>
              <p className="text-xs mt-1">Versao 2.0.0 - Universal</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
