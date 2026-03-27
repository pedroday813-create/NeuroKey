"use client"

import { Sparkles, Code, Lightbulb, Pencil } from "lucide-react"
import { NexoLogo } from "./nexo-logo"

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Lightbulb,
    text: "Me dê ideias para um projeto de aplicativo",
  },
  {
    icon: Code,
    text: "Explique como funciona uma API REST",
  },
  {
    icon: Pencil,
    text: "Escreva um e-mail profissional de apresentação",
  },
  {
    icon: Sparkles,
    text: "Crie uma história curta criativa",
  },
]

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NexoLogo size={64} showText={false} />
        </div>

        {/* Main heading */}
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 text-balance">
          O que você quer criar, descobrir ou resolver hoje?
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg mb-12">
          Nexo é uma IA leve e inteligente, pronta para ajudar você a explorar ideias, resolver problemas e criar coisas incríveis.
        </p>

        {/* Suggestion cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-accent/50 hover:bg-card/80 transition-all duration-200 text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <suggestion.icon className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm text-foreground">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
