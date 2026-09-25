import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 text-emerald-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98]',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800',
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
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
