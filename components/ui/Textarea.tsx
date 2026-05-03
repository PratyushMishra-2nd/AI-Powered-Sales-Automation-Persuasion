import { forwardRef, useId } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, hint, className = '', required, ...props }, ref) => {
  const uid = useId()
  const inputId = props.id ?? uid
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.2em] text-neural-text/90 font-medium"
      >
        <span className="text-neural-primary text-xs" aria-hidden="true">›</span>
        {label}
        {required && <span className="text-neural-accent" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
        <span className="flex-1 border-b border-neural-border/60" aria-hidden="true" />
      </label>
      {hint && <p id={hintId} className="text-[10px] font-mono text-neural-muted">{hint}</p>}
      <div className="relative bg-white/[0.025] border border-neural-border/50 transition-all duration-200 focus-within:border-neural-primary/70 focus-within:shadow-[0_0_14px_rgba(0,212,255,0.12)] focus-within:bg-white/[0.04]">
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          aria-required={required}
          aria-describedby={hintId}
          className={`w-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-neural-primary/50 text-[#F1F5F9] font-mono text-sm py-2.5 px-4 placeholder:text-[#5a7a96] resize-none ${className}`}
          {...props}
        />
      </div>
    </div>
  )
})
Textarea.displayName = 'Textarea'
export default Textarea
