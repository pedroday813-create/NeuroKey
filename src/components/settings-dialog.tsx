'use client'

import { useState, useEffect } from 'react'
import { Settings, Info, ExternalLink, RotateCcw, Sparkles, Zap } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettings } from '@/hooks/use-settings'
import { 
  AVAILABLE_MODELS, 
  DEFAULT_SETTINGS, 
  PROVIDERS, 
  getDefaultModel,
  isModelForProvider,
  type ProviderType 
} from '@/lib/types'
import { toast } from 'sonner'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, resetSettings, isLoaded } = useSettings()
  const [localSettings, setLocalSettings] = useState(settings)

  // Sincroniza com settings carregados
  useEffect(() => {
    if (isLoaded) {
      setLocalSettings(settings)
    }
  }, [settings, isLoaded])

  // Quando provider muda, atualiza modelo para o padrao do provider
  const handleProviderChange = (provider: ProviderType) => {
    const currentModel = localSettings.model
    const needsModelChange = !isModelForProvider(currentModel, provider)
    
    setLocalSettings(prev => ({
      ...prev,
      provider,
      model: needsModelChange ? getDefaultModel(provider) : currentModel,
    }))
  }

  const handleSave = () => {
    updateSettings(localSettings)
    toast.success('Configuracoes salvas!')
    onOpenChange(false)
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
    resetSettings()
    toast.info('Configuracoes restauradas para padrao')
  }

  const currentProvider = PROVIDERS[localSettings.provider]
  const availableModels = AVAILABLE_MODELS[localSettings.provider]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuracoes
          </DialogTitle>
          <DialogDescription>
            Personalize o comportamento do MindDriveAI
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="provider" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="model">Modelo</TabsTrigger>
            <TabsTrigger value="about">Sobre</TabsTrigger>
          </TabsList>

          {/* Provider Selection */}
          <TabsContent value="provider" className="space-y-6 mt-4">
            <div className="space-y-4">
              <Label>Selecione o Provider de IA</Label>
              
              {/* Provider Cards */}
              <div className="grid gap-3">
                {(Object.entries(PROVIDERS) as [ProviderType, typeof PROVIDERS.gemini][]).map(([key, provider]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleProviderChange(key)}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                      localSettings.provider === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${
                      localSettings.provider === key ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {key === 'gemini' ? (
                        <Sparkles className="h-5 w-5 text-primary" />
                      ) : (
                        <Zap className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {provider.description}
                      </div>
                    </div>
                    {localSettings.provider === key && (
                      <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Ativo
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Dica:</span>{' '}
                  {currentProvider.apiKeyHint}
                </p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-end pt-2">
              <Button onClick={handleSave}>
                Salvar alteracoes
              </Button>
            </div>
          </TabsContent>

          {/* Model Settings */}
          <TabsContent value="model" className="space-y-6 mt-4">
            {/* Current Provider */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Provider ativo:</span>
              <span className="font-medium">{currentProvider.name}</span>
            </div>

            {/* Model selection */}
            <div className="space-y-3">
              <Label htmlFor="model">Modelo de IA</Label>
              <Select
                value={localSettings.model}
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperatura</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {localSettings.temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature"
                value={[localSettings.temperature]}
                onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, temperature: value }))}
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Valores baixos = respostas mais focadas. Valores altos = mais criativas.
              </p>
            </div>

            <Separator />

            {/* Max tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxTokens">Tokens maximos</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {localSettings.maxTokens.toLocaleString()}
                </span>
              </div>
              <Slider
                id="maxTokens"
                value={[localSettings.maxTokens]}
                onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, maxTokens: value }))}
                min={256}
                max={8192}
                step={256}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Limite maximo de tokens na resposta da IA.
              </p>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar padrao
              </Button>
              <Button onClick={handleSave}>
                Salvar alteracoes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">MindDriveAI</h4>
                  <p className="text-sm text-muted-foreground">
                    Um assistente de IA inteligente e intuitivo, com suporte a Google Gemini e OpenAI (ChatGPT).
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Recursos</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Suporte a Google Gemini e OpenAI
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Streaming de respostas em tempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Historico de conversas salvo localmente
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Aplicacao desktop em Python (tkinter)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Exportacao de conversas em Markdown
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Links uteis</h4>
                <div className="space-y-2">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Chave API do Google Gemini
                  </a>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Chave API da OpenAI
                  </a>
                  <a
                    href="https://github.com/pedroday813-create/NeuroKey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Repositorio no GitHub
                  </a>
                </div>
              </div>

              <Separator />

              <div className="text-center text-sm text-muted-foreground">
                <p>Desenvolvido por Pedro Rodrigues Cruz</p>
                <p className="text-xs mt-1">Versao 1.0.0</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
