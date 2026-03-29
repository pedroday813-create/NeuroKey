'use client'

import { useState, useEffect } from 'react'
import { Settings, Info, ExternalLink, RotateCcw } from 'lucide-react'
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
import { AVAILABLE_MODELS, DEFAULT_SETTINGS } from '@/lib/types'
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

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === localSettings.model)

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

        <Tabs defaultValue="model" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="model">Modelo</TabsTrigger>
            <TabsTrigger value="about">Sobre</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-6 mt-4">
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
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.provider}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModel && (
                <p className="text-xs text-muted-foreground">
                  Provider: {selectedModel.provider}
                </p>
              )}
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
                    Um assistente de IA inteligente e intuitivo, desenvolvido para ajudar voce a criar, descobrir e resolver problemas de forma eficiente.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Recursos</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
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
                    Multiplos modelos de IA disponiveis
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
                    href="https://ai.google.dev/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Precos e limites da Gemini API
                  </a>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Obter chave API do Google AI Studio
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
