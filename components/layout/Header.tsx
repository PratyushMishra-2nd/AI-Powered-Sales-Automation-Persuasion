'use client'
import { useApp } from '@/context/AppContext'

export default function Header() {
  const { apiKey, setApiKey } = useApp()
  return (
    <header className="fixed top-0 left-16 right-0 z-20 h-14 flex items-center justify-between px-6 border-b border-neural-border bg-neural-bg/90 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-neural-primary animate-pulse-glow" />
        <span className="font-display text-neural-primary tracking-[0.2em] text-sm font-bold">OUTREACH_AI</span>
        <span className="text-neural-muted text-xs font-mono">// SALES COMMAND CENTER</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-neural-muted text-xs font-display tracking-widest">› API_KEY</span>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="bg-transparent border-b border-neural-border focus:border-neural-primary outline-none text-neural-text font-mono text-xs px-2 py-1 w-48 transition-colors placeholder:text-neural-muted/50"
          />
        </div>
        <div className="flex items-center gap-1.5 border border-neural-border px-2 py-1">
          <div className="w-1.5 h-1.5 bg-neural-secondary animate-pulse" />
          <span className="text-neural-secondary text-xs font-display tracking-wider">[GEMINI 2.0]</span>
        </div>
      </div>
    </header>
  )
}
