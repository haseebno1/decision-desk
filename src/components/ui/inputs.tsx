import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

/* DFK Calm Intelligence inputs: inset surface, hairline border, violet focus. */

const BASE =
  'w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none transition-[border-color,background-color] duration-150'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return <input className={`${BASE} ${className}`} {...rest} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', rows = 3, ...rest } = props
  return <textarea rows={rows} className={`${BASE} ${className}`} {...rest} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props
  return (
    <select className={`${BASE} ${className}`} {...rest}>
      {children}
    </select>
  )
}

export function Card({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: 'div' | 'section' | 'article'
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tag className={`rounded-xl border border-hairline bg-surface p-4 ${className}`}>
      {children}
    </Tag>
  )
}

export function EmptyState({
  title,
  children,
  icon,
}: {
  title: string
  children?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline py-14 text-center">
      {icon && (
        <div
          aria-hidden
          className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-mid text-accent-text"
        >
          {icon}
        </div>
      )}
      <p className="font-medium text-ink">{title}</p>
      <div className="max-w-sm text-sm text-ink-soft">{children}</div>
    </div>
  )
}
