'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { callGemini, callGeminiWithSearch } from '@/lib/gemini'
import type { SearchResult } from '@/lib/gemini'
import { sanitize } from '@/lib/sanitize'
import { requireStr } from '@/lib/validators'
import type { OutreachResult } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import OutputCard from '@/components/OutputCard'

function demoOutreach(d: Record<string, string>): OutreachResult {
  const greet = d.tone === 'bold' ? d.name + ' —' : d.tone === 'professional' ? 'Hi ' + d.name + ',' : 'Hey ' + d.name + ','
  const hook = d.activity ? `${d.activity} — that resonated with me.` : `Noticed ${d.company} is ${d.info.split('.')[0].toLowerCase()}.`
  const bridge = d.pain
    ? `${d.pain.split(',')[0]} is a challenge I hear constantly from ${d.role}s. ${d.product} was built to solve exactly this.`
    : `${d.product} helps ${d.role}s ${d.value.split('.')[0].toLowerCase()}.`
  const proof = d.proof ? `\n\nFor context: ${d.proof}` : ''
  return {
    subject: `Quick question, ${d.name.split(' ')[0]}`,
    body: `${greet}\n\n${hook}\n\n${bridge}${proof}\n\nWorth a 15-min chat this week?`,
    followup: `Hey ${d.name.split(' ')[0]}, just bumping this — no pressure. Happy to share a one-pager if that's easier.`,
  }
}

function SectionDivider({
  label,
  collapsible,
  open,
  onToggle,
}: {
  label: string
  collapsible?: boolean
  open?: boolean
  onToggle?: () => void
}) {
  if (collapsible) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 pt-1 pb-0.5 w-full group"
      >
        <span className="text-neural-primary/80 text-[10px] font-mono tracking-[0.25em] shrink-0">{label}</span>
        <div className="flex-1 border-t border-neural-border/30" />
        <span className={`text-neural-primary/70 text-[11px] font-mono transition-transform duration-200 leading-none ${open ? '' : '-rotate-90'}`}>▾</span>
      </button>
    )
  }
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-neural-primary/80 text-[10px] font-mono tracking-[0.25em] shrink-0">{label}</span>
      <div className="flex-1 border-t border-neural-border/30" />
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = circ * (score / 100)
  const color = score < 35 ? '#4a6278' : score < 60 ? '#ffa502' : score < 85 ? '#00d4ff' : '#39ff14'
  const label = score < 35 ? 'GENERIC' : score < 60 ? 'DECENT' : score < 85 ? 'STRONG' : 'ELITE'
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="64" height="64" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#1a2a3a" strokeWidth="3.5" />
        <circle
          cx="30" cy="30" r={r}
          fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.4s ease', filter: score > 0 ? `drop-shadow(0 0 5px ${color}88)` : 'none' }}
        />
        <text x="30" y="35" textAnchor="middle" fill={color} fontSize="13" fontFamily="monospace" fontWeight="bold">{score}</text>
      </svg>
      <div className="text-center">
        <div className="text-[9px] font-display tracking-[0.2em]" style={{ color }}>{label}</div>
        <div className="text-[8px] font-mono text-neural-muted mt-0.5">PERSONALIZATION</div>
      </div>
    </div>
  )
}

function ResearchCard({ research }: { research: SearchResult }) {
  return (
    <div className="border border-neural-primary/30 bg-neural-primary/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-primary/20 bg-neural-primary/8">
        <div className="w-1.5 h-1.5 bg-neural-primary rounded-full animate-pulse" />
        <span className="text-neural-primary text-[10px] font-display tracking-[0.2em]">GOOGLE SEARCH INTEL</span>
        {research.queries[0] && (
          <span className="ml-auto text-neural-primary/60 text-[9px] font-mono truncate max-w-[40%]">
            &quot;{research.queries[0]}&quot;
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-neural-text font-mono text-xs leading-relaxed whitespace-pre-wrap">{research.text}</p>
        {research.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-neural-primary/15 flex flex-col gap-1">
            {research.sources.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-neural-primary/50 text-[8px] font-mono shrink-0">[{i + 1}]</span>
                <span className="text-neural-primary/70 text-[9px] font-mono truncate">{s.title || s.uri}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const TONES = [
  { id: 'friendly', label: 'Friendly', hint: 'casual opener' },
  { id: 'professional', label: 'Professional', hint: 'exec-level' },
  { id: 'bold', label: 'Bold', hint: 'pattern interrupt' },
]

export default function OutreachGenerator() {
  const { apiKey, showToast, setIsAIActive, setLastOutreach, setActiveTool } = useApp()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'researching' | 'generating'>('idle')
  const [result, setResult] = useState<OutreachResult | null>(null)
  const [research, setResearch] = useState<SearchResult | null>(null)
  const [researchMode, setResearchMode] = useState(false)
  const [tone, setTone] = useState('friendly')
  const [contextOpen, setContextOpen] = useState(true)
  const [valueOpen, setValueOpen] = useState(true)
  const [activity, setActivity] = useState('')
  const [pain, setPain] = useState('')
  const [proof, setProof] = useState('')

  const toneIdx = TONES.findIndex(t => t.id === tone)
  const score = 40 + (activity.trim() ? 20 : 0) + (pain.trim() ? 20 : 0) + (proof.trim() ? 20 : 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const d = {
      name: sanitize(fd.get('name'), 100),
      role: sanitize(fd.get('role'), 100),
      company: sanitize(fd.get('company'), 100),
      info: sanitize(fd.get('info'), 500),
      activity: sanitize(fd.get('activity'), 500),
      pain: sanitize(fd.get('pain'), 500),
      product: sanitize(fd.get('product'), 200),
      value: sanitize(fd.get('value'), 300),
      proof: sanitize(fd.get('proof'), 200),
      tone,
    }

    setLoading(true)
    setIsAIActive(true)
    setResearch(null)

    try {
      let data: OutreachResult
      let searchIntel = ''

      if (!apiKey) {
        data = demoOutreach(d)
        showToast('Demo mode — add API key for AI output', 'info')
      } else {
        // Step 1: Google Search research (if enabled)
        if (researchMode && d.company) {
          setStep('researching')
          try {
            const sr = await callGeminiWithSearch(
              `Recent news, funding rounds, product launches, and strategic priorities for ${d.company}. Focus on events in the last 6 months relevant to a ${d.role}.`,
              apiKey
            )
            setResearch(sr)
            searchIntel = sr.text ? `\nLive Google Search Intel about ${d.company}:\n${sr.text}\n` : ''
          } catch {
            showToast('Research step failed — continuing without it', 'info')
          }
        }

        // Step 2: Generate email with Gemini
        setStep('generating')
        const sys = `You are a top 1% sales copywriter. Generate hyper-personalized cold emails.\nRules: Specific personalization hook (NOT generic). Under 120 words. Low-friction CTA. No buzzwords.\nRespond ONLY with valid JSON, no markdown: {"subject":"<max 8 words>","body":"<email with \\n\\n between paragraphs>","followup":"<day 3 follow-up under 60 words>"}`
        const user = `Prospect: ${d.name}, ${d.role} at ${d.company}\nCompany: ${d.info}\nRecent Activity: ${d.activity || 'N/A'}\nPain Points: ${d.pain || 'N/A'}\nMy Product: ${d.product}\nValue Prop: ${d.value}\nSocial Proof: ${d.proof || 'N/A'}${searchIntel}\nTone: ${d.tone}`
        const raw = (await callGemini(sys, user, apiKey)) as Record<string, unknown>
        data = {
          subject: requireStr(raw.subject, 150),
          body: requireStr(raw.body, 2000),
          followup: requireStr(raw.followup, 500),
        }
      }

      setResult(data)
      setLastOutreach({ subject: data.subject, body: data.body })
    } catch (err) {
      console.error(err)
      showToast('Something went wrong — please try again.', 'error')
    } finally {
      setLoading(false)
      setStep('idle')
      setIsAIActive(false)
    }
  }

  function handleReset() {
    setResult(null)
    setResearch(null)
  }

  return (
    <div
      className="flex gap-8"
      style={{ height: 'calc(100vh - 8.5rem)', transition: 'all 0.5s ease' }}
    >
      {/* ── Form panel ── */}
      <div
        className="flex flex-col shrink-0 min-w-0 overflow-hidden"
        style={{ width: result ? '42%' : '55%', transition: 'width 0.5s ease' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="text-neural-primary text-lg">⚡</span>
          <h2 className="font-display text-neural-text tracking-[0.15em] text-sm">OUTREACH GENERATOR</h2>
          <div className="flex-1 border-t border-neural-border/50" />
          {/* Research mode toggle — only when API key set */}
          {apiKey && (
            <button
              type="button"
              onClick={() => setResearchMode(r => !r)}
              title="Enable Google Search to research the company before writing"
              className={`flex items-center gap-1.5 px-2 py-1 border text-[9px] font-display tracking-widest transition-all duration-200 ${
                researchMode
                  ? 'border-neural-primary text-neural-primary bg-neural-primary/10'
                  : 'border-neural-border text-neural-muted hover:border-neural-primary/50 hover:text-neural-text'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${researchMode ? 'bg-neural-primary' : 'bg-neural-border'}`} />
              SEARCH
            </button>
          )}
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto pr-2">
          <form id="outreach-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5" autoComplete="off">
            <SectionDivider label="// TARGET" />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Prospect Name" name="name" placeholder="Sarah Chen" required />
              <Input label="Role" name="role" placeholder="VP of Sales" required />
            </div>
            <Input label="Company" name="company" placeholder="Acme Corp" required />

            {/* Tone segmented control */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.2em] text-neural-text/90 font-medium">
                <span className="text-neural-primary text-xs">›</span>
                Tone
                <span className="flex-1 border-b border-neural-border/60" />
              </label>
              <div className="relative flex bg-white/[0.02] border border-neural-border/50 p-0.5">
                <div
                  className="absolute top-0.5 bottom-0.5 transition-all duration-200 ease-out bg-neural-primary/15 border border-neural-primary/50"
                  style={{ left: `calc(${toneIdx * (100 / 3)}% + 2px)`, width: `calc(${100 / 3}% - 4px)` }}
                />
                {TONES.map(t => (
                  <button
                    key={t.id} type="button" onClick={() => setTone(t.id)}
                    className={`relative z-10 flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors duration-150
                      ${tone === t.id ? 'text-neural-primary' : 'text-neural-muted hover:text-neural-text/80'}`}
                  >
                    <span className="text-[10px] font-display tracking-wider">{t.label}</span>
                    <span className={`text-[8px] font-mono transition-colors ${tone === t.id ? 'text-neural-primary/70' : 'text-neural-muted'}`}>{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <SectionDivider label="// CONTEXT" collapsible open={contextOpen} onToggle={() => setContextOpen(o => !o)} />
            {contextOpen && (
              <>
                <Textarea label="Company Description" name="info" rows={2} placeholder="B2B SaaS, 200 employees, Series B…" required />
                <Textarea label="Recent Activity" name="activity" rows={2} placeholder="Posted about scaling SDR teams…" value={activity} onChange={e => setActivity(e.target.value)} />
                <Textarea label="Pain Points" name="pain" rows={2} placeholder="Low reply rates, slow ramp-up…" value={pain} onChange={e => setPain(e.target.value)} />
              </>
            )}

            <SectionDivider label="// VALUE PROP" collapsible open={valueOpen} onToggle={() => setValueOpen(o => !o)} />
            {valueOpen && (
              <>
                <Input label="Your Product" name="product" placeholder="AI cold email platform" required />
                <Textarea label="Value Proposition" name="value" rows={2} placeholder="3x more meetings, no extra headcount" required />
                <Input label="Social Proof" name="proof" placeholder="200+ teams, 34% reply rate" value={proof} onChange={e => setProof(e.target.value)} />
              </>
            )}
          </form>
        </div>

        {/* Sticky CTA */}
        <div className="pt-3 pb-1 border-t border-neural-border/30 mt-3 bg-neural-bg/95 backdrop-blur-sm shrink-0">
          <Button type="submit" form="outreach-form" loading={loading} className="w-full justify-center">
            {loading
              ? step === 'researching' ? '🔍 RESEARCHING...' : '⚡ GENERATING...'
              : researchMode ? '🔍 RESEARCH + GENERATE' : '⚡ GENERATE OUTREACH'}
          </Button>
        </div>
      </div>

      {/* ── Output panel ── */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-neural-primary text-lg">✉</span>
          <h2 className="font-display text-neural-text tracking-[0.15em] text-sm">OUTPUT STREAM</h2>
          <div className="flex-1 border-t border-neural-border/50" />
          {result && !loading && (
            <>
              <button
                type="button"
                onClick={() => { setActiveTool('response') }}
                className="text-neural-secondary hover:text-neural-secondary/80 text-[9px] font-display tracking-widest transition-colors shrink-0 border border-neural-secondary/40 hover:border-neural-secondary/70 px-2 py-1"
              >
                ANALYZE REPLY →
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-neural-muted hover:text-neural-accent text-[9px] font-display tracking-widest transition-colors shrink-0"
              >
                [RESET]
              </button>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {/* Research step indicator */}
            {step === 'researching' && (
              <div className="border border-neural-primary/30 bg-neural-primary/5 p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-primary rounded-full animate-pulse" />
                <div>
                  <p className="text-neural-primary text-[10px] font-display tracking-widest">GOOGLE SEARCH ACTIVE</p>
                  <p className="text-neural-muted text-[9px] font-mono mt-0.5">Researching company signals via Google Search...</p>
                </div>
              </div>
            )}
            {(['SUBJECT LINE', 'EMAIL BODY', 'FOLLOW-UP'] as const).map((label, i) => (
              <div key={label} className="border border-neural-border bg-neural-surface overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                  <div className="w-2 h-2 bg-neural-accent/30" />
                  <div className="w-2 h-2 bg-[#ffa502]/30" />
                  <div className="w-2 h-2 bg-neural-secondary/30" />
                  <span className="ml-2 text-neural-muted text-[10px] font-display tracking-[0.2em]">{label}</span>
                  <span className="ml-auto text-neural-primary text-[10px] font-mono animate-blink">▋</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="h-2 bg-neural-border/50 rounded animate-pulse" style={{ width: ['58%', '95%', '72%'][i] }} />
                  {i > 0 && (
                    <>
                      <div className="h-2 bg-neural-border/35 rounded animate-pulse w-full" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 bg-neural-border/35 rounded animate-pulse" style={{ width: '83%', animationDelay: '300ms' }} />
                      {i === 1 && <div className="h-2 bg-neural-border/25 rounded animate-pulse" style={{ width: '65%', animationDelay: '450ms' }} />}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !result ? (
          /* Empty state with live personalization score */
          <div className="relative flex flex-col items-center justify-center gap-6 min-h-[320px] border border-neural-border/40 overflow-hidden p-8">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-neural-primary/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-neural-primary/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-neural-primary/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-neural-primary/30" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(0,212,255,0.04) 0%, transparent 65%)' }} />

            <ScoreRing score={score} />

            <div className="text-center space-y-1.5">
              <p className="font-display text-neural-text text-xs tracking-[0.25em]">SIGNAL QUALITY</p>
              <p className="font-mono text-neural-muted text-[10px]">Fill optional context fields to increase score</p>
            </div>

            <div className="w-full border-t border-neural-border/20 pt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'ACTIVITY', filled: !!activity.trim(), points: '+20pts' },
                { label: 'PAIN', filled: !!pain.trim(), points: '+20pts' },
                { label: 'PROOF', filled: !!proof.trim(), points: '+20pts' },
              ].map(({ label, filled, points }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${filled ? 'bg-neural-secondary shadow-[0_0_6px_rgba(57,255,20,0.6)]' : 'bg-neural-border'}`} />
                  <span className={`text-[8px] font-display tracking-widest transition-colors duration-300 ${filled ? 'text-neural-secondary' : 'text-neural-muted'}`}>{label}</span>
                  <span className={`text-[8px] font-mono transition-colors duration-300 ${filled ? 'text-neural-secondary/60' : 'text-neural-muted/70'}`}>{points}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Research intel card (if research was performed) */}
            {research && <ResearchCard research={research} />}
            <OutputCard title="subject_line" tag="[HDR]" content={result.subject} variant="highlight" typewriter />
            <OutputCard title="email_body" tag="[BODY]" content={result.body} typewriter />
            <OutputCard title="followup_day3" tag="[FUP]" content={result.followup} variant="success" typewriter />
          </div>
        )}
      </div>
    </div>
  )
}
