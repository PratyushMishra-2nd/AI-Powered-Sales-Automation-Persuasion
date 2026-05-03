'use client'
import type { ToolId } from '@/types'

const TOOLS: { id: ToolId; label: string; short: string; symbol: string }[] = [
  { id: 'outreach', label: 'Outreach Generator', short: 'OUT', symbol: '⚡' },
  { id: 'ab',       label: 'A/B Tester',         short: 'A/B', symbol: '⊕' },
  { id: 'response', label: 'Response Analyzer',  short: 'ANA', symbol: '◈' },
  { id: 'objection',label: 'Objection Simulator',short: 'SIM', symbol: '◉' },
  { id: 'callprep', label: 'Call Prep Brief',    short: 'CLP', symbol: '◎' },
]

interface Props {
  active: ToolId
  onSelect: (id: ToolId) => void
}

export default function Sidebar({ active, onSelect }: Props) {
  return (
    <aside
      className="sidebar-bg fixed left-0 top-0 bottom-0 z-30 w-16 flex flex-col items-center py-4 gap-2 border-r border-neural-border/60"
      aria-label="Tool navigation"
    >
      {/* Logo mark */}
      <div className="w-8 h-8 border border-neural-primary/70 flex items-center justify-center mb-4 shadow-[0_0_12px_rgba(0,212,255,0.2)]" aria-hidden="true">
        <div className="w-2 h-2 bg-neural-primary animate-pulse" />
      </div>

      <nav className="flex flex-col gap-0.5 w-full" role="navigation" aria-label="Sales tools">
        {TOOLS.map(tool => {
          const isActive = active === tool.id
          return (
            <div key={tool.id} className="relative group/item">
              <button
                onClick={() => onSelect(tool.id)}
                aria-label={tool.label}
                aria-pressed={isActive}
                aria-current={isActive ? 'page' : undefined}
                title={tool.label}
                className={`relative w-full h-12 flex flex-col items-center justify-center gap-0.5 transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neural-primary focus-visible:ring-inset
                  ${isActive
                    ? 'bg-neural-primary/8 text-neural-primary'
                    : 'text-neural-muted/70 hover:text-neural-text hover:bg-white/[0.03]'
                  }`}
              >
                {/* Active left bar — bright + wide */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-neural-primary shadow-[0_0_8px_rgba(0,212,255,0.8)]" aria-hidden="true" />
                )}
                {/* Hover left bar */}
                {!isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-neural-primary/0 group-hover/item:bg-neural-primary/30 transition-all duration-150" aria-hidden="true" />
                )}
                <span className={`text-base leading-none transition-all ${isActive ? 'drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]' : ''}`} aria-hidden="true">
                  {tool.symbol}
                </span>
                <span className={`text-[8px] font-display tracking-widest ${isActive ? 'text-neural-primary' : ''}`} aria-hidden="true">
                  {tool.short}
                </span>
              </button>

              {/* Tooltip on hover — hidden from AT since button already has aria-label */}
              <div
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                  opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 delay-300"
                aria-hidden="true"
              >
                <div className="bg-neural-surface border border-neural-border/80 px-2.5 py-1.5 whitespace-nowrap shadow-[0_0_16px_rgba(0,0,0,0.5)]">
                  <span className="text-[10px] font-display text-neural-text tracking-wider">{tool.label}</span>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neural-border/80" />
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom status */}
      <div className="mt-auto flex flex-col items-center gap-1.5" aria-hidden="true">
        <div className="w-1.5 h-1.5 bg-neural-secondary rounded-full animate-pulse shadow-[0_0_6px_rgba(57,255,20,0.6)]" />
        <span className="text-neural-secondary/60 text-[7px] font-display tracking-widest">LIVE</span>
      </div>
    </aside>
  )
}
