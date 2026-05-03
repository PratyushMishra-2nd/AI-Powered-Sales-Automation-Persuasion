'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { callGemini } from '@/lib/gemini'
import { sanitize } from '@/lib/sanitize'
import { requireStr, requireArr, requireOneOf } from '@/lib/validators'
import type { ABTestResult, ABVariant } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import OutputCard from '@/components/OutputCard'

function demoAB(d: Record<string, string>, variantCount: number): ABTestResult {
  const angles = ['Pain-Focused', 'Curiosity-Driven', 'Social Proof', 'Direct-Ask', 'Opportunity-Focused']
  const variants: ABVariant[] = angles.slice(0, variantCount).map((angle, i) => ({
    angle,
    subject: i === 0
      ? `${d.name.split(' ')[0]}, quick fix for ${d.role} headaches`
      : i === 1
        ? `Weird pattern I noticed at ${d.company}`
        : i === 2
          ? `What 200+ teams discovered`
          : i === 3
            ? `15 min this week, ${d.name.split(' ')[0]}?`
            : `${d.company}'s next growth unlock`,
    body: i === 0
      ? `Hey ${d.name},\n\nI keep hearing from ${d.role}s that ${d.context.split('.')[0].toLowerCase()} creates a lot of friction.\n\n${d.product} — worth a quick look?`
      : i === 1
        ? `${d.name},\n\nSomething interesting: companies like ${d.company} that ${d.context.split('.')[0].toLowerCase()} often leave a lot of pipeline on the table.\n\nCurious if that tracks with what you're seeing?`
        : i === 2
          ? `Hi ${d.name},\n\n200+ sales teams use ${d.product.split('.')[0]} to solve exactly the challenge you're facing at ${d.company}.\n\n15 min this week?`
          : i === 3
            ? `${d.name},\n\nSimple ask: would you be open to a 15-min call to see if ${d.product} could add value for ${d.company}?\n\nNo pitch — just a conversation.`
            : `Hey ${d.name},\n\nMost ${d.role}s I talk to at companies like ${d.company} are sitting on an untapped growth lever.\n\n${d.product} surfaces it in under a week.`,
    prediction: (i === 0 ? 'best' : i === 1 ? 'good' : 'ok') as 'best' | 'good' | 'ok',
  }))
  return {
    variants,
    analysis: `Variant 1 (Pain-Focused) likely wins — it leads with a specific, relatable problem that ${d.role}s face daily, creating immediate resonance.`,
  }
}

export default function ABTester() {
  const { apiKey, showToast, setIsAIActive } = useApp()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ABTestResult | null>(null)
  const [variantCount, setVariantCount] = useState(3)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const d = {
      name: sanitize(fd.get('name'), 100),
      role: sanitize(fd.get('role'), 100),
      company: sanitize(fd.get('company'), 100),
      context: sanitize(fd.get('context'), 500),
      product: sanitize(fd.get('product'), 300),
    }

    setLoading(true)
    setIsAIActive(true)
    try {
      let data: ABTestResult
      if (!apiKey) {
        data = demoAB(d, variantCount)
        showToast('Demo mode — add API key for AI output', 'info')
      } else {
        const sys = `Generate cold email variants for A/B testing. Each variant must use a different angle (pain-focused, opportunity-focused, social-proof-focused, curiosity-driven, direct-ask). Each under 100 words with a subject line. Predict performance.\nRespond ONLY with valid JSON, no markdown fences:\n{"variants":[{"angle":"<angle name>","subject":"<subject>","body":"<email>","prediction":"best|good|ok"}],"analysis":"<1-2 sentences on which wins and why>"}`
        const user = `Number of variants: ${variantCount}\nProspect: ${d.name}, ${d.role} at ${d.company}\nContext: ${d.context}\nProduct: ${d.product}`
        const raw = await callGemini(sys, user, apiKey) as Record<string, unknown>
        const variants = requireArr(raw.variants).map(v => {
          const variant = v as Record<string, unknown>
          return {
            angle: requireStr(variant.angle, 100),
            subject: requireStr(variant.subject, 150),
            body: requireStr(variant.body, 1000),
            prediction: requireOneOf(variant.prediction, ['best', 'good', 'ok'] as const, 'ok'),
          } satisfies ABVariant
        })
        data = {
          variants,
          analysis: requireStr(raw.analysis, 500),
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

  const predictionColors: Record<string, string> = {
    best: 'text-neural-secondary border-neural-secondary',
    good: 'text-neural-primary border-neural-primary',
    ok: 'text-neural-muted border-neural-muted',
  }

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Form */}
      <div className="overflow-y-auto pr-2">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-primary text-xl">⊕</span>
          <h2 className="font-display text-neural-text tracking-[0.15em]">A/B VARIANT TESTER</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prospect Name" name="name" placeholder="Marcus Webb" required />
            <Input label="Role" name="role" placeholder="Head of Sales" required />
          </div>
          <Input label="Company" name="company" placeholder="TechCorp Inc" required />
          <Textarea label="Context / Background" name="context" rows={3} placeholder="Company recently raised Series B, expanding sales team…" required />
          <Textarea label="Your Product" name="product" rows={2} placeholder="AI-powered sales engagement platform" required />
          {/* Variant count selector */}
          <div>
            <div className="text-[10px] font-display uppercase tracking-[0.2em] text-neural-muted mb-2 flex items-center gap-2">
              <span className="text-neural-primary">›</span> VARIANT COUNT
              <span className="flex-1 border-b border-dashed border-neural-border/50" />
            </div>
            <div className="flex gap-1">
              {[3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVariantCount(n)}
                  className={`flex-1 py-2 text-sm font-display tracking-wider border transition-all
                    ${variantCount === n
                      ? 'border-neural-primary text-neural-primary bg-neural-primary/5'
                      : 'border-neural-border text-neural-muted hover:border-neural-primary/50'}`}
                >
                  {n} VARIANTS
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" loading={loading} className="mt-2 w-full justify-center">
            {loading ? 'GENERATING...' : '⊕ GENERATE VARIANTS'}
          </Button>
        </form>
      </div>

      {/* Output */}
      <div className="overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-muted text-xl">⊕</span>
          <h2 className="font-display text-neural-muted tracking-[0.15em]">VARIANT STREAM</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        {!result ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neural-border">
            <span className="text-4xl text-neural-border mb-3">⊕</span>
            <p className="font-display text-neural-muted text-sm tracking-widest">AWAITING INPUT</p>
            <p className="font-mono text-neural-muted/50 text-xs mt-1">Fill form and generate variants</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {result.variants.map((v, i) => (
              <div key={i} className="relative border border-neural-border bg-neural-surface">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                  <span className="text-neural-muted font-display text-[10px] tracking-widest">VARIANT {i + 1}</span>
                  <span className="text-neural-primary font-display text-[10px] tracking-widest border border-neural-primary/30 px-1.5 py-0.5">{v.angle.toUpperCase()}</span>
                  <span className={`ml-auto text-[10px] font-display border px-1.5 py-0.5 ${predictionColors[v.prediction] || 'text-neural-muted border-neural-muted'}`}>
                    [{v.prediction.toUpperCase()}]
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-neural-secondary font-mono text-xs mb-2 font-bold">SUBJ: {v.subject}</p>
                  <pre className="text-neural-text font-mono text-sm whitespace-pre-wrap leading-relaxed">{v.body}</pre>
                </div>
              </div>
            ))}
            {result.analysis && (
              <OutputCard title="ai_analysis" tag="[INTEL]" content={result.analysis} variant="warning" typewriter />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
