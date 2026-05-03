'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { callGemini } from '@/lib/gemini'
import { sanitize } from '@/lib/sanitize'
import { requireStr, requireNum, requireArr, requireOneOf } from '@/lib/validators'
import type { ResponseAnalysisResult } from '@/types'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import OutputCard from '@/components/OutputCard'

function demoResponse(reply: string): ResponseAnalysisResult {
  const lower = reply.toLowerCase()
  const pos = lower.includes('interest') || lower.includes('sure') || lower.includes('tell me more') || lower.includes('sounds')
  const neg = lower.includes('not interested') || lower.includes('no thanks') || lower.includes('remove') || lower.includes('unsubscribe')
  const sentiment: 'positive' | 'negative' | 'neutral' = neg ? 'negative' : pos ? 'positive' : 'neutral'
  const signals = pos
    ? ['Expressed openness to learning more', 'Engaged with specific details']
    : neg
      ? ['Clear rejection signal', 'Low priority indicator']
      : ['Non-committal but responded', 'Possible timing concern']
  return {
    sentiment,
    signals,
    intent: pos
      ? 'Genuinely curious but not yet committed — needs a concrete reason to take the next step.'
      : neg
        ? 'Not interested right now. May be worth revisiting in 3-6 months with a different angle.'
        : 'On the fence — they responded (good sign) but need more value before committing time.',
    urgency: pos ? 4 : neg ? 1 : 2,
    analysis: pos
      ? 'This is a warm reply. They took the time to engage, which puts them in the top 10% of cold outreach responses. Strike while the iron is hot — be specific about next steps.'
      : neg
        ? "A clear pass. Don't burn the bridge. Acknowledge gracefully and leave the door open for future timing."
        : "They replied but didn't commit — classic \"interested but cautious.\" Your next move should add value without asking for more of their time.",
    suggested_reply: pos
      ? "Thanks for the reply! Rather than a generic overview, I'd love to share a 2-min walkthrough specific to your setup.\n\nWould Thursday or Friday work for a quick 15-min call? Happy to work around your schedule."
      : neg
        ? "Totally understand — appreciate you letting me know. I'll keep this off your plate.\n\nIf anything changes down the road, happy to reconnect. Wishing you a great quarter."
        : "Got it — no rush at all. I put together a quick one-pager that shows exactly how this works for teams like yours.\n\nWant me to send it over? Zero commitment, just context.",
  }
}

export default function ResponseAnalyzer() {
  const { apiKey, showToast, setIsAIActive, lastOutreach } = useApp()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResponseAnalysisResult | null>(null)
  const [originalEmail, setOriginalEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const original = sanitize(fd.get('original'), 2000)
    const reply = sanitize(fd.get('reply'), 2000)
    const goal = sanitize(fd.get('goal'), 200)

    setLoading(true)
    setIsAIActive(true)
    try {
      let data: ResponseAnalysisResult
      if (!apiKey) {
        data = demoResponse(reply)
        showToast('Demo mode — add API key for AI output', 'info')
      } else {
        const sys = `You are an expert sales coach analyzing prospect replies. Assess sentiment, buying signals, intent, and urgency. Write the ideal follow-up response.\nRespond ONLY with valid JSON, no markdown fences:\n{"sentiment":"positive|negative|neutral","signals":["<signal1>","<signal2>"],"intent":"<what they actually want>","urgency":<1-5>,"analysis":"<2-3 sentence breakdown>","suggested_reply":"<the ideal response email>"}`
        const user = `Seller's goal: ${goal || 'Book a meeting'}\n\nOriginal email:\n${original}\n\nProspect's reply:\n${reply}`
        const raw = await callGemini(sys, user, apiKey) as Record<string, unknown>
        data = {
          sentiment: requireOneOf(raw.sentiment, ['positive', 'negative', 'neutral'] as const, 'neutral'),
          urgency: requireNum(raw.urgency, 1, 5),
          analysis: requireStr(raw.analysis, 500),
          intent: requireStr(raw.intent, 300),
          suggested_reply: requireStr(raw.suggested_reply, 1000),
          signals: requireArr(raw.signals).map(s => requireStr(s, 200)).filter(Boolean),
        }
      }
      setResult(data)
    } catch (err) {
      console.error(err)
      showToast('Something went wrong — please try again.', 'error')
    } finally {
      setLoading(false)
      setIsAIActive(false)
    }
  }

  const sentimentStyles: Record<string, string> = {
    positive: 'border-neural-secondary text-neural-secondary bg-neural-secondary/10',
    negative: 'border-neural-accent text-neural-accent bg-neural-accent/10',
    neutral: 'border-neural-muted text-neural-muted bg-neural-muted/10',
  }

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Form */}
      <div className="overflow-y-auto pr-2">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-primary text-xl">◈</span>
          <h2 className="font-display text-neural-text tracking-[0.15em]">RESPONSE ANALYZER</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
          <Input label="Your Goal" name="goal" placeholder="Book a discovery call" />

          <div className="flex flex-col gap-1">
            {lastOutreach && !originalEmail && (
              <button
                type="button"
                onClick={() => setOriginalEmail(`Subject: ${lastOutreach.subject}\n\n${lastOutreach.body}`)}
                className="self-start flex items-center gap-1.5 text-[9px] font-display tracking-widest border border-neural-secondary/40 text-neural-secondary px-2 py-1 hover:bg-neural-secondary/10 transition-colors"
              >
                ↑ USE LAST GENERATED EMAIL
              </button>
            )}
            <Textarea
              label="Your Original Email"
              name="original"
              rows={5}
              placeholder="Hey Sarah,&#10;&#10;I noticed you recently…"
              required
              value={originalEmail}
              onChange={e => setOriginalEmail(e.target.value)}
            />
          </div>
          <Textarea label="Prospect's Reply" name="reply" rows={5} placeholder="Thanks for reaching out. We're actually looking at a few solutions right now…" required />
          <Button type="submit" loading={loading} className="mt-2 w-full justify-center">
            {loading ? 'ANALYZING...' : '◈ ANALYZE RESPONSE'}
          </Button>
        </form>
      </div>

      {/* Output */}
      <div className="overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-muted text-xl">◈</span>
          <h2 className="font-display text-neural-muted tracking-[0.15em]">ANALYSIS STREAM</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        {!result ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neural-border">
            <span className="text-4xl text-neural-border mb-3">◈</span>
            <p className="font-display text-neural-muted text-sm tracking-widest">AWAITING INPUT</p>
            <p className="font-mono text-neural-muted/50 text-xs mt-1">Paste the reply and analyze</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Sentiment + Urgency */}
            <div className="border border-neural-border bg-neural-surface">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                <div className="w-2 h-2 bg-neural-accent" />
                <div className="w-2 h-2 bg-[#ffa502]" />
                <div className="w-2 h-2 bg-neural-secondary" />
                <span className="ml-2 text-neural-muted text-[10px] font-display uppercase tracking-[0.2em]">sentiment_analysis</span>
              </div>
              <div className="p-4 flex items-center gap-4">
                <span className={`text-sm font-display tracking-wider border px-3 py-1.5 ${sentimentStyles[result.sentiment] || sentimentStyles.neutral}`}>
                  {result.sentiment.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-neural-muted font-display text-[10px] tracking-widest">URGENCY</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div
                        key={n}
                        className={`w-4 h-4 border ${n <= result.urgency ? 'bg-neural-primary border-neural-primary' : 'border-neural-border'}`}
                      />
                    ))}
                  </div>
                  <span className="text-neural-primary font-mono text-xs">{result.urgency}/5</span>
                </div>
              </div>
              <div className="px-4 pb-4">
                <pre className="text-neural-text font-mono text-sm whitespace-pre-wrap leading-relaxed">{result.analysis}</pre>
              </div>
            </div>

            {/* Buying Signals */}
            {result.signals.length > 0 && (
              <div className="border border-neural-border bg-neural-surface">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                  <span className="text-neural-muted text-[10px] font-display uppercase tracking-[0.2em]">buying_signals</span>
                  <span className="ml-auto text-[10px] font-display border border-neural-primary text-neural-primary px-1.5 py-0.5">[SIG]</span>
                </div>
                <div className="p-4">
                  {result.signals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                      <span className="text-neural-primary font-mono text-xs mt-0.5">•</span>
                      <span className="text-neural-text font-mono text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intent */}
            <OutputCard title="prospect_intent" tag="[INT]" content={result.intent} />

            {/* Suggested Reply */}
            <OutputCard title="suggested_reply" tag="[RPL]" content={result.suggested_reply} variant="highlight" typewriter />
          </div>
        )}
      </div>
    </div>
  )
}
