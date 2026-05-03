'use client'
import { useApp } from '@/context/AppContext'

export default function Header() {
  const { apiKey, setApiKey } = useApp()
  return (
    <>
      {/* Skip to main content — top a11y pattern for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-neural-primary focus:text-neural-bg focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:tracking-widest"
      >
        Skip to main content
      </a>

      <header
        role="banner"
        className="fixed top-0 left-16 right-0 z-20 h-14 flex items-center justify-between px-6 border-b border-neural-border bg-neural-bg/90 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-neural-primary animate-pulse-glow" aria-hidden="true" />
          <span className="font-display text-neural-primary tracking-[0.2em] text-sm font-bold">OUTREACH_AI</span>
          <span className="text-neural-muted text-xs font-mono" aria-hidden="true">// SALES COMMAND CENTER</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="api-key-input" className="text-neural-muted text-xs font-display tracking-widest">
              <span aria-hidden="true">› </span>API_KEY
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza..."
              aria-label="Google AI Studio API Key"
              aria-describedby="api-key-hint"
              autoComplete="off"
              className="bg-transparent border-b border-neural-border focus:border-neural-primary focus-visible:outline-none outline-none text-neural-text font-mono text-xs px-2 py-1 w-48 transition-colors placeholder:text-neural-muted/50"
            />
            <span id="api-key-hint" className="sr-only">
              Enter your Google AI Studio API key to enable AI generation. The key is stored only in your browser session.
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 border border-neural-border px-2 py-1"
            role="status"
            aria-label="AI model: Gemini 2.0 Flash — active"
          >
            <div className="w-1.5 h-1.5 bg-neural-secondary animate-pulse" aria-hidden="true" />
            <span className="text-neural-secondary text-xs font-display tracking-wider" aria-hidden="true">[GEMINI 2.0]</span>
          </div>
        </div>
      </header>
    </>
  )
}
