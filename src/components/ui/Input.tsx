import { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={cn(
        'w-full border px-3 py-2.5 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--theme-accent)_45%,transparent)]',
        className,
      )}
      style={{
        borderRadius: 'calc(var(--theme-radius) - 0.35rem)',
        background: 'color-mix(in srgb, var(--theme-card) 88%, white)',
        borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)',
      }}
      {...props}
    />
  )
}

export default Input
