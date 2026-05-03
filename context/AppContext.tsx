'use client'
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { ToolId } from '@/types'

interface Toast { id: number; message: string; type: 'info' | 'error' | 'success' }

interface AppContextValue {
  apiKey: string
  setApiKey: (key: string) => void
  isAIActive: boolean
  setIsAIActive: (v: boolean) => void
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
  activeTool: ToolId
  setActiveTool: (id: ToolId) => void
  lastOutreach: { subject: string; body: string } | null
  setLastOutreach: (v: { subject: string; body: string } | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState('')
  const [isAIActive, setIsAIActive] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [activeTool, setActiveTool] = useState<ToolId>('outreach')
  const [lastOutreach, setLastOutreach] = useState<{ subject: string; body: string } | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('gemini_key')
    if (stored) setApiKeyState(stored)
  }, [])

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key)
    if (key) sessionStorage.setItem('gemini_key', key)
    else sessionStorage.removeItem('gemini_key')
  }, [])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <AppContext.Provider value={{
      apiKey, setApiKey,
      isAIActive, setIsAIActive,
      toasts, showToast,
      activeTool, setActiveTool,
      lastOutreach, setLastOutreach,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
