'use client'

import { Sparkles, Code, Lightbulb, Pencil, Brain, Zap } from 'lucide-react'
import { MindDriveAILogo } from './minddriveai-logo'

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Lightbulb,
    title: 'Gerar ideias',
    text: 'Me de ideias criativas para um projeto de aplicativo mobile',
  },
  {
    icon: Code,
    title: 'Programacao',
    text: 'Explique como funciona uma API REST e de exemplos praticos',
  },
  {
    icon: Pencil,
    title: 'Escrita',
    text: 'Escreva um e-mail profissional de apresentacao para um cliente',
  },
  {
    icon: Brain,
    title: 'Analise',
    text: 'Analise os pros e contras de trabalhar remoto vs presencial',
  },
]

const features = [
  {
    icon: Zap,
    title: 'Respostas rapidas',
    description: 'Streaming em tempo real',
  },
  {
    icon: Brain,
    title: 'Inteligente',
    description: 'Modelos de IA avancados',
  },
  {
    icon: Sparkles,
    title: 'Criativo',
    description: 'Ajuda em diversas tarefas',
  },
]

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="text-center max-w-2xl mx-auto w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <MindDriveAILogo size={72} showText={false} />
        </div>

        {/* Main heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
          Como posso ajudar voce hoje?
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-base md:text-lg mb-8 text-pretty max-w-lg mx-auto">
          MindDriveAI e seu assistente de IA inteligente, pronto para ajudar a criar, descobrir e resolver problemas.
        </p>

        {/* Features */}
        <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <feature.icon className="h-4 w-4 text-accent" />
              <span>{feature.title}</span>
            </div>
          ))}
        </div>

        {/* Suggestion cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <suggestion.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {suggestion.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {suggestion.text}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-muted-foreground mt-8">
          Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> para enviar
        </p>
      </div>
    </div>
  )
}
