import type { ReactNode } from 'react'

interface SportIconProps {
  icon: string
  fallback?: string | null
  title?: string
}

const svgProps = {
  viewBox: '0 0 32 32',
  width: '1em',
  height: '1em',
  focusable: false,
  'aria-hidden': true,
} as const

function Peteca() {
  return (
    <svg {...svgProps}>
      <g fill="#f5f2e8" stroke="#aaa58f" strokeWidth=".35">
        <path d="M16 19C13 13 13 7 16 2c3 5 3 11 0 17Z" transform="rotate(-18 16 19)" />
        <path d="M16 19C13 13 13 7 16 2c3 5 3 11 0 17Z" transform="rotate(18 16 19)" />
        <path d="M16 19C13 13 13 7 16 2c3 5 3 11 0 17Z" />
      </g>
      <path d="M11 18h10v4H11z" fill="#f5c518" />
      <path d="M9.5 21h13v5H9.5z" fill="#29292f" />
      <ellipse cx="16" cy="26" rx="6.5" ry="2.2" fill="#151519" />
    </svg>
  )
}

function Futevolei() {
  return (
    <svg {...svgProps}>
      <defs>
        <radialGradient id="sport-futevolei" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffe273" />
          <stop offset="55%" stopColor="#f5c518" />
          <stop offset="100%" stopColor="#a97808" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="url(#sport-futevolei)" />
      <g fill="#1e1e1e">
        <path d="m16 11 3.7 5-3.7 5-3.7-5Z" />
        <path d="m16 3 3.5 4.5-3.5 4.5-3.5-4.5Z" />
        <path d="m16 20 3.5 4.5-3.5 4.5-3.5-4.5Z" />
      </g>
    </svg>
  )
}

function VoleiAreia() {
  return (
    <svg {...svgProps}>
      <circle cx="16" cy="16" r="13" fill="#f5f5f5" />
      <path d="M16 3C0 9 0 23 16 29 8 23 8 9 16 3Z" fill="#2a5fe0" />
      <path d="M16 3c-4 6-4 20 0 26 4-6 4-20 0-26Z" fill="#f5c518" />
      <path d="M16 3c16 6 16 20 0 26 8-6 8-20 0-26Z" fill="#2a5fe0" />
      <circle cx="16" cy="16" r="13" fill="none" stroke="#aeb2bc" strokeWidth=".6" />
    </svg>
  )
}

const CUSTOM_ICONS: Record<string, () => ReactNode> = {
  futevolei: Futevolei,
  'volei-areia': VoleiAreia,
  peteca: Peteca,
}

/** Renderiza o identificador canônico da API sem tratar chave como texto. */
export default function SportIcon({ icon, fallback, title }: SportIconProps) {
  const CustomIcon = CUSTOM_ICONS[icon]
  const content = CustomIcon ? <CustomIcon /> : <>{fallback ?? ''}</>
  return title ? <span title={title} aria-label={title}>{content}</span> : <>{content}</>
}
