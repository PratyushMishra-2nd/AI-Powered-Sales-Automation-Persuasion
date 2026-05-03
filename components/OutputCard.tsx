'use client'
import { useState, useEffect } from 'react'

interface OutputCardProps {
  title: string
  tag?: string
  content: string
  typewriter?: boolean
  variant?: 'default' | 'highlight' | 'success' | 'warning'
}

export default function OutputCard({ title, tag, content, typewriter = false, variant = 'default' }: OutputCardProps) {
  const [displayed, setDisplayed] = useState(typewriter ? '' : content)
  const [done, setDone] = useState(!typewriter)

  useEffect(() => {
    if (!typewriter || !content) { setDisplayed(content); setDone(true); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const speed = content.length > 300 ? 8 : 15
    const timer = setInterval(() => {
      i++
      if (i <= content.length) {
        setDisplayed(content.slice(0, i))
      } else {
        clearInterval(timer)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [content, typewriter])

  const tagColor = {
    default: 'text-neural-primary border-neural-primary',
    highlight: 'text-neural-secondary border-neural-secondary',
    success: 'text-neural-secondary border-neural-secondary',
    warning: 'text-neural-accent border-neural-accent',
  }[variant]

  return (
    <div className="relative border border-neural-border bg-neural-surface overflow-hidden group">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
        <div className="w-2 h-2 bg-neural-accent" />
        <div className="w-2 h-2 bg-[#ffa502]" />
        <div className="w-2 h-2 bg-neural-secondary" />
        <span className="ml-2 text-neural-muted text-[10px] font-display uppercase tracking-[0.2em] flex-1">{title}</span>
        {tag && <span className={`text-[10px] font-display border px-1.5 py-0.5 ${tagColor}`}>{tag}</span>}
        <button
          onClick={() => navigator.clipboard.writeText(content)}
          className="ml-2 text-neural-muted hover:text-neural-primary text-[10px] font-display tracking-widest transition-colors opacity-0 group-hover:opacity-100"
        >
          [COPY]
        </button>
      </div>

      {/* Content with scanlines */}
      <div className="relative p-4 scanline">
        <pre className="text-neural-text font-mono text-sm whitespace-pre-wrap leading-relaxed">
          {displayed}
          {!done && <span className="text-neural-primary animate-blink">▋</span>}
        </pre>
      </div>
    </div>
  )
}
