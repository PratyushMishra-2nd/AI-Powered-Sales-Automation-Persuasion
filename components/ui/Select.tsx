interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: React.ReactNode
}

export default function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.2em] text-neural-muted mb-1">
        <span className="text-neural-primary">›</span>
        {label}
        <span className="flex-1 border-b border-dashed border-neural-border/50" />
      </label>
      <select
        className={`w-full bg-neural-surface border-b border-neural-border focus:border-neural-primary outline-none
          text-neural-text font-mono text-sm py-2 pl-4 transition-colors appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
