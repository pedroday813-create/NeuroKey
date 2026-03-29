'use client'

import { cn } from '@/lib/utils'

interface MindDriveAILogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function MindDriveAILogo({ size = 32, showText = true, className }: MindDriveAILogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          {/* Gradiente principal - verde/ciano */}
          <linearGradient id="mindGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          {/* Glow externo */}
          <radialGradient id="mindGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          
          {/* Filtro de brilho */}
          <filter id="mindBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          </filter>
        </defs>
        
        {/* Glow de fundo */}
        <circle cx="24" cy="24" r="22" fill="url(#mindGlow)" />
        
        {/* Anel externo */}
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="url(#mindGradient)"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
        
        {/* Cerebro estilizado - lado esquerdo */}
        <path
          d="M16 24c0-4.5 3-8 7-8s5 2 5 2"
          stroke="url(#mindGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Cerebro estilizado - lado direito */}
        <path
          d="M32 24c0 4.5-3 8-7 8s-5-2-5-2"
          stroke="url(#mindGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Conexoes neurais */}
        <circle cx="18" cy="20" r="2" fill="url(#mindGradient)" />
        <circle cx="30" cy="20" r="2" fill="url(#mindGradient)" />
        <circle cx="18" cy="28" r="2" fill="url(#mindGradient)" />
        <circle cx="30" cy="28" r="2" fill="url(#mindGradient)" />
        
        {/* Linhas de conexao */}
        <line x1="18" y1="20" x2="30" y2="28" stroke="url(#mindGradient)" strokeWidth="1.5" opacity="0.6" />
        <line x1="30" y1="20" x2="18" y2="28" stroke="url(#mindGradient)" strokeWidth="1.5" opacity="0.6" />
        
        {/* Nucleo central - ponto de IA */}
        <circle cx="24" cy="24" r="3" fill="url(#mindGradient)" />
        <circle cx="24" cy="24" r="1.5" fill="#fff" opacity="0.9" />
      </svg>
      
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          MindDriveAI
        </span>
      )}
    </div>
  )
}
