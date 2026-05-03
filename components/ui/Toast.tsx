'use client'
import { useApp } from '@/context/AppContext'

export default function Toast() {
  const { toasts } = useApp()
  return (
    <div className="fixed bottom-6 left-20 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-slide-up font-mono text-xs px-4 py-2 border flex items-center gap-2
            ${t.type === 'error' ? 'border-neural-accent text-neural-accent bg-neural-surface' :
              t.type === 'success' ? 'border-neural-secondary text-neural-secondary bg-neural-surface' :
              'border-neural-primary text-neural-primary bg-neural-surface'}`}
        >
          <span>[{t.type.toUpperCase()}]</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
