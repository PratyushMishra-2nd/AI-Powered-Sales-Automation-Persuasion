interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  loading?: boolean
  children: React.ReactNode
}

export default function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonProps) {
  const base = [
    'relative font-display tracking-[0.15em] text-sm uppercase transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'flex items-center gap-2 px-5 py-3',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neural-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neural-bg',
  ].join(' ')
  const styles = {
    primary: [
      'border border-neural-primary/80 text-neural-primary font-semibold',
      'bg-gradient-to-r from-neural-primary/20 via-neural-primary/10 to-transparent',
      'shadow-[0_2px_20px_rgba(0,212,255,0.2),inset_0_1px_0_rgba(0,212,255,0.1)]',
      'hover:from-neural-primary/30 hover:via-neural-primary/15 hover:to-neural-primary/5',
      'hover:shadow-[0_4px_30px_rgba(0,212,255,0.4),inset_0_1px_0_rgba(0,212,255,0.2)]',
      'hover:border-neural-primary',
      'active:scale-[0.98] active:shadow-[0_2px_10px_rgba(0,212,255,0.2)]',
    ].join(' '),
    ghost: 'border border-neural-border/60 text-neural-muted hover:border-neural-primary/40 hover:text-neural-text hover:bg-white/[0.02]',
  }
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={loading || props.disabled}
      aria-busy={loading}
      aria-disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
        </svg>
      )}
      {children}
    </button>
  )
}
