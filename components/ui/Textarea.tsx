import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  required?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, required, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.2em] text-neural-text/90 font-medium">
      <span className="text-neural-primary text-xs">›</span>
      {label}
      {required && <span className="text-neural-accent">*</span>}
      <span className="flex-1 border-b border-neural-border/60" />
    </label>
    <div className="relative bg-white/[0.025] border border-neural-border/50 transition-all duration-200 focus-within:border-neural-primary/70 focus-within:shadow-[0_0_14px_rgba(0,212,255,0.12)] focus-within:bg-white/[0.04]">
      <textarea
        ref={ref}
        className={`w-full bg-transparent outline-none text-[#F1F5F9] font-mono text-sm py-2.5 px-4 placeholder:text-[#5a7a96] resize-none ${className}`}
        {...props}
      />
    </div>
  </div>
))
Textarea.displayName = 'Textarea'
export default Textarea
