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
  const [copied, setCopied] = useState(false)

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

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="relative border border-neural-border bg-neural-surface overflow-hidden group"
      role="region"
      aria-label={title}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
        <div className="w-2 h-2 bg-neural-accent" aria-hidden="true" />
        <div className="w-2 h-2 bg-[#ffa502]" aria-hidden="true" />
        <div className="w-2 h-2 bg-neural-secondary" aria-hidden="true" />
        <span className="ml-2 text-neural-muted text-[10px] font-display uppercase tracking-[0.2em] flex-1">{title}</span>
        {tag && <span className={`text-[10px] font-display border px-1.5 py-0.5 ${tagColor}`} aria-hidden="true">{tag}</span>}
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied!' : `Copy ${title} to clipboard`}
          aria-live="polite"
          className="ml-2 text-neural-muted hover:text-neural-primary text-[10px] font-display tracking-widest transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neural-primary"
        >
          {copied ? '[COPIED ✓]' : '[COPY]'}
        </button>
      </div>

      {/* Content with scanlines */}
      <div
        className="relative p-4 scanline"
        aria-live="polite"
        aria-atomic="false"
        aria-label={done ? `${title} output complete` : `${title} generating...`}
      >
        <pre className="text-neural-text font-mono text-sm whitespace-pre-wrap leading-relaxed">
          {displayed}
          {!done && <span className="text-neural-primary animate-blink" aria-hidden="true">▋</span>}
        </pre>
      </div>
    </div>
  )
}
