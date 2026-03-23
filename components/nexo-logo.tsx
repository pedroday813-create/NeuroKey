"use client"

interface NexoLogoProps {
  size?: number
  showText?: boolean
}

export function NexoLogo({ size = 32, showText = true }: NexoLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer ring with gradient */}
        <defs>
          <linearGradient id="nexoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="nexoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Glow effect */}
        <circle cx="24" cy="24" r="20" fill="url(#nexoGlow)" />
        
        {/* Main ring */}
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="url(#nexoGradient)"
          strokeWidth="2.5"
          fill="none"
        />
        
        {/* Inner connection nodes */}
        <circle cx="24" cy="14" r="3" fill="url(#nexoGradient)" />
        <circle cx="32" cy="28" r="3" fill="url(#nexoGradient)" />
        <circle cx="16" cy="28" r="3" fill="url(#nexoGradient)" />
        
        {/* Connection lines forming N shape */}
        <path
          d="M24 14 L16 28 M24 14 L32 28 M16 28 L32 28"
          stroke="url(#nexoGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Center dot - AI spark */}
        <circle cx="24" cy="22" r="2" fill="#fff" opacity="0.9" />
      </svg>
      
      {showText && (
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Nexo
        </span>
      )}
    </div>
  )
}
