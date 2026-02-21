import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const stylesByVariant: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--theme-button-bg)] text-[var(--theme-button-text)] hover:bg-[var(--theme-button-hover)] border-transparent',
  secondary:
    'bg-[color-mix(in_srgb,var(--theme-card)_92%,transparent)] text-[var(--theme-text)] border-[color-mix(in_srgb,var(--theme-accent)_42%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_20%,var(--theme-card))]',
  outline:
    'bg-transparent text-[var(--theme-accent)] border-[color-mix(in_srgb,var(--theme-accent)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_16%,transparent)]',
}

const Button = ({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60',
        stylesByVariant[variant],
        className,
      )}
      style={{
        borderRadius: 'var(--theme-radius)',
        boxShadow: 'var(--theme-shadow)',
      }}
      {...props}
    />
  )
}

export default Button
