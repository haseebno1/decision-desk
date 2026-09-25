import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/* Shared tailwind variants for the DFK "Calm Intelligence" visual system. */

const SHARED =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98]'

const VARIANTS = {
  primary:
    'bg-accent text-white shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:shadow-[0_0_32px_rgba(139,92,246,0.4)] hover:bg-[#7c4ee8]',
  secondary:
    'border border-hairline bg-surface-mid text-ink hover:bg-surface-high hover:border-hairline-strong',
  ghost: 'text-ink-soft hover:bg-surface-high hover:text-ink',
} as const

export type ButtonVariant = keyof typeof VARIANTS

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${SHARED} px-4 py-2 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

const LINK_VARIANTS = {
  primary: 'text-accent-text hover:underline',
  secondary: 'text-ink-soft hover:text-ink',
  ghost: 'text-ink-soft hover:text-ink',
} as const

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant
}

/**
 * Anchor twin of Button for link-styled-as-button affordances. Keeps
 * focus/active parity with Button while remaining a real <a>.
 */
export function TextLink({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: TextLinkProps) {
  return (
    <a className={`${SHARED} px-4 py-2 ${LINK_VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </a>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-hairline bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-ink-soft">
      {children}
    </kbd>
  )
}

export function SectionLabel({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'accent'
}) {
  return (
    <p
      className={cnLabel(
        'font-mono text-[11px] font-semibold uppercase tracking-[0.14em]',
        tone === 'accent' ? 'text-accent-text' : 'text-ink-soft',
      )}
    >
      {children}
    </p>
  )
}

function cnLabel(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
