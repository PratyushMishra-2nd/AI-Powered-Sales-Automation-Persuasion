'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { callGemini } from '@/lib/gemini'
import { sanitize } from '@/lib/sanitize'
import { requireStr, requireArr } from '@/lib/validators'
import type { CallPrepResult } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import OutputCard from '@/components/OutputCard'

function demoCallPrep(d: Record<string, string>): CallPrepResult {
  return {
    summary: `${d.name} is a ${d.role} at ${d.company}. ${d.context.split('.')[0]}. Likely evaluating solutions in a competitive market — focus on differentiation and measurable outcomes.`,
    openers: [
      `I saw that ${d.company} is ${d.context.split('.')[0].toLowerCase()} — curious how that's impacting your team's priorities this quarter.`,
      `Before we dive in, I'd love to understand what "success" looks like for you in your role right now.`,
    ],
    talking_points: [
      `${d.product} reduces ramp-up time by 60% — directly relevant given ${d.company}'s growth stage.`,
      `Unlike generic tools, this is built specifically for ${d.role}s who need speed without sacrificing quality.`,
      `The ROI model shows payback within 45 days for teams at ${d.company}'s scale.`,
    ],
    objections: [
      {
        objection: 'We already have a solution for this',
        rebuttal: `That makes sense — most teams do. The question isn't whether you have a tool, it's whether it's keeping up with your growth. A lot of ${d.role}s tell me their current setup worked great at 50 reps but breaks at 200.`,
      },
      {
        objection: 'We need to think about it',
        rebuttal: `Totally fair. What would be most helpful — a one-pager you can share with the team, or a quick sandbox they can try? I want to make this easy, not add to your plate.`,
      },
    ],
    competitive_intel: d.competitors
      ? `Compared to ${d.competitors}: our edge is speed-to-value and personalization depth. Most competitors require 2-4 weeks of setup. We're live in 48 hours with full integration.`
      : `Position against likely alternatives by emphasizing: faster implementation (48hrs vs weeks), no training required, and measurable ROI within the first month.`,
    questions: [
      `What's your current process for this, and where does it create the most friction?`,
      `If you could fix one thing about your current workflow, what would it be?`,
      `Who else would need to be involved in evaluating something like this?`,
    ],
  }
}

export default function CallPrepBrief() {
  const { apiKey, showToast, setIsAIActive } = useApp()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CallPrepResult | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const d = {
      name: sanitize(fd.get('name'), 100),
      role: sanitize(fd.get('role'), 100),
      company: sanitize(fd.get('company'), 100),
      context: sanitize(fd.get('context'), 1000),
      product: sanitize(fd.get('product'), 200),
      competitors: sanitize(fd.get('competitors'), 200),
    }

    setLoading(true)
    setIsAIActive(true)
    try {
      let data: CallPrepResult
      if (!apiKey) {
        data = demoCallPrep(d)
        showToast('Demo mode — add API key for AI output', 'info')
      } else {
        const sys = `You are a sales strategist creating a call prep brief. Provide key talking points, likely objections with rebuttals, competitive positioning, conversation openers, and discovery questions.\nRespond ONLY with valid JSON, no markdown fences:\n{"summary":"<1-2 sentence prospect summary>","openers":["<opener1>","<opener2>"],"talking_points":["<point1>","<point2>","<point3>"],"objections":[{"objection":"<obj>","rebuttal":"<rebuttal>"}],"competitive_intel":"<positioning vs competitors>","questions":["<q1>","<q2>","<q3>"]}`
        const user = `Meeting with: ${d.name}, ${d.role} at ${d.company}\nContext: ${d.context}\nMy product: ${d.product}\nKnown competitors: ${d.competitors || 'Unknown'}`
        const raw = await callGemini(sys, user, apiKey) as Record<string, unknown>
        data = {
          summary: requireStr(raw.summary, 300),
          openers: requireArr(raw.openers).map(o => requireStr(o, 300)).filter(Boolean),
          talking_points: requireArr(raw.talking_points).map(t => requireStr(t, 300)).filter(Boolean),
          objections: requireArr(raw.objections)
            .map(o => {
              const obj = o as Record<string, unknown>
              return { objection: requireStr(obj.objection, 300), rebuttal: requireStr(obj.rebuttal, 300) }
            })
            .filter(o => o.objection),
          competitive_intel: requireStr(raw.competitive_intel, 500),
          questions: requireArr(raw.questions).map(q => requireStr(q, 300)).filter(Boolean),
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

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Form */}
      <div className="overflow-y-auto pr-2">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-primary text-xl">◎</span>
          <h2 className="font-display text-neural-text tracking-[0.15em]">CALL PREP BRIEF</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prospect Name" name="name" placeholder="Jordan Kim" required />
            <Input label="Role" name="role" placeholder="Director of Revenue Ops" required />
          </div>
          <Input label="Company" name="company" placeholder="ScaleUp Inc" required />
          <Textarea label="Call Context" name="context" rows={4} placeholder="Inbound lead from LinkedIn. They're scaling their SDR team from 10 to 30 reps this quarter…" required />
          <Input label="Your Product" name="product" placeholder="AI-powered sales coaching platform" required />
          <Input label="Known Competitors" name="competitors" placeholder="Gong, Chorus, Salesloft" />
          <Button type="submit" loading={loading} className="mt-2 w-full justify-center">
            {loading ? 'PREPARING...' : '◎ GENERATE BRIEF'}
          </Button>
        </form>
      </div>

      {/* Output */}
      <div className="overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-muted text-xl">◎</span>
          <h2 className="font-display text-neural-muted tracking-[0.15em]">BRIEF STREAM</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        {!result ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neural-border">
            <span className="text-4xl text-neural-border mb-3">◎</span>
            <p className="font-display text-neural-muted text-sm tracking-widest">AWAITING INPUT</p>
            <p className="font-mono text-neural-muted/50 text-xs mt-1">Fill form to generate your brief</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Summary */}
            <OutputCard title="prospect_summary" tag="[SUM]" content={result.summary} variant="highlight" typewriter />

            {/* Openers */}
            <div className="border border-neural-border bg-neural-surface">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                <span className="text-neural-muted text-[10px] font-display uppercase tracking-[0.2em]">conversation_openers</span>
                <span className="ml-auto text-[10px] font-display border border-neural-primary text-neural-primary px-1.5 py-0.5">[OPN]</span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {result.openers.map((opener, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-neural-primary font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-neural-text font-mono text-sm leading-relaxed">{opener}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Talking Points */}
            <div className="border border-neural-border bg-neural-surface">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                <span className="text-neural-muted text-[10px] font-display uppercase tracking-[0.2em]">talking_points</span>
                <span className="ml-auto text-[10px] font-display border border-neural-secondary text-neural-secondary px-1.5 py-0.5">[TP]</span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {result.talking_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-neural-secondary font-mono text-xs mt-0.5 shrink-0">›</span>
                    <span className="text-neural-text font-mono text-sm leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Objections & Rebuttals */}
            <div className="border border-neural-border bg-neural-surface">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                <span className="text-neural-muted text-[10px] font-display uppercase tracking-[0.2em]">likely_objections</span>
                <span className="ml-auto text-[10px] font-display border border-neural-accent text-neural-accent px-1.5 py-0.5">[OBJ]</span>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {result.objections.map((o, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-neural-accent font-mono text-xs mt-0.5 shrink-0">✗</span>
                      <span className="text-neural-accent font-mono text-sm italic">"{o.objection}"</span>
                    </div>
                    <div className="flex items-start gap-2 ml-4">
                      <span className="text-neural-secondary font-mono text-xs mt-0.5 shrink-0">✓</span>
                      <span className="text-neural-text font-mono text-sm leading-relaxed">{o.rebuttal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Intel */}
            {result.competitive_intel && (
              <OutputCard title="competitive_intel" tag="[CI]" content={result.competitive_intel} variant="warning" typewriter />
            )}

            {/* Discovery Questions */}
            <div className="border border-neural-border bg-neural-surface">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                <span className="text-neural-muted text-[10px] font-display uppercase tracking-[0.2em]">discovery_questions</span>
                <span className="ml-auto text-[10px] font-display border border-neural-primary text-neural-primary px-1.5 py-0.5">[Q]</span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {result.questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-neural-primary font-mono text-xs mt-0.5 shrink-0">→</span>
                    <span className="text-neural-text font-mono text-sm leading-relaxed">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
