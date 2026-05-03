'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { callGemini } from '@/lib/gemini'
import { sanitize } from '@/lib/sanitize'
import { requireStr, requireNum, requireOneOf } from '@/lib/validators'
import type { ObjectionResult, ScoreResult } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import OutputCard from '@/components/OutputCard'

type ScenarioType = 'random' | 'price' | 'timing' | 'competitor' | 'authority' | 'need'

function demoObjection(product: string, persona: string, scenario: ScenarioType): ObjectionResult {
  const objections: Record<string, { objection: string; difficulty: 'easy' | 'medium' | 'hard' }> = {
    price: {
      objection: `Honestly, we've looked at tools like ${product} before, and the pricing never made sense for our team size. We'd need to see a very clear ROI before even considering bringing this to finance.`,
      difficulty: 'hard',
    },
    timing: {
      objection: `I appreciate the outreach, but we just rolled out a new process last quarter and the team is still adjusting. Adding another tool right now would create more chaos than value.`,
      difficulty: 'medium',
    },
    competitor: {
      objection: `We're already using [competitor] and it's deeply embedded in our workflow. Switching would mean retraining 30+ reps and migrating all our templates. That's a big ask.`,
      difficulty: 'hard',
    },
    authority: {
      objection: `This sounds interesting, but I'm not the person who makes these decisions. Our CRO handles all tool purchases and she's pretty set on our current stack.`,
      difficulty: 'easy',
    },
    need: {
      objection: `I'm not sure we actually need this. Our current process is working fine — we hit quota last quarter. Why fix what isn't broken?`,
      difficulty: 'medium',
    },
  }
  const type: ScenarioType = scenario === 'random'
    ? (['price', 'timing', 'competitor', 'authority', 'need'] as ScenarioType[])[Math.floor(Math.random() * 5)]
    : scenario
  const o = objections[type] || objections.price
  return {
    ...o,
    type,
    context: `This is one of the most common objections ${persona}s raise. It tests whether you can acknowledge their concern without being defensive, then reframe the conversation.`,
  }
}

function demoScore(reply: string): ScoreResult {
  const len = reply.length
  const hasQuestion = reply.includes('?')
  const sc = Math.min(10, Math.max(3, Math.round(len / 40 + (hasQuestion ? 2 : 0))))
  return {
    overall: sc,
    empathy: Math.min(10, sc + 1),
    reframe: sc,
    value: Math.max(3, sc - 1),
    cta: hasQuestion ? sc : Math.max(3, sc - 2),
    feedback: sc >= 7
      ? `Strong response. You acknowledged their concern without being defensive and pivoted to value effectively. ${hasQuestion ? 'Good use of a question to keep the conversation open.' : 'Consider ending with a question to keep the conversation open.'}`
      : `Your response could use more empathy upfront — acknowledge their position before pivoting. ${hasQuestion ? '' : 'End with a clear but low-pressure question to keep the door open.'} Try to connect your reframe to a specific, measurable outcome.`,
    improved_version: `I completely understand — that's a valid concern and I hear it a lot.\n\nWhat I've seen work well for teams in a similar position is starting with a small pilot. No full rollout, no big commitment. Just enough to see if the numbers move.\n\nWould it be worth a 15-minute look at how that might work for your team?`,
  }
}

export default function ObjectionSimulator() {
  const { apiKey, showToast, setIsAIActive } = useApp()
  const [loadingObjection, setLoadingObjection] = useState(false)
  const [loadingScore, setLoadingScore] = useState(false)
  const [objection, setObjection] = useState<ObjectionResult | null>(null)
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [userReply, setUserReply] = useState('')
  const [product, setProduct] = useState('')

  async function handleGenerateObjection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const productVal = sanitize(fd.get('product'), 200)
    const persona = sanitize(fd.get('persona'), 200)
    const scenario = requireOneOf(fd.get('scenario'), ['random', 'price', 'timing', 'competitor', 'authority', 'need'] as ScenarioType[], 'random')

    setProduct(productVal)
    setLoadingObjection(true)
    setIsAIActive(true)
    setScore(null)
    setUserReply('')
    try {
      let data: ObjectionResult
      if (!apiKey) {
        data = demoObjection(productVal, persona, scenario)
        showToast('Demo mode — add API key for AI output', 'info')
      } else {
        const sys = `You are a realistic sales prospect generating tough but realistic objections. Stay in character.\nRespond ONLY with valid JSON, no markdown fences:\n{"objection":"<the prospect's objection, 2-3 sentences, realistic and challenging>","type":"price|timing|competitor|authority|need","difficulty":"easy|medium|hard","context":"<brief context about why this objection is common>"}`
        const user = `You are: ${persona}\nSeller is pitching: ${productVal}\nObjection type: ${scenario === 'random' ? 'any realistic type' : scenario}`
        const raw = await callGemini(sys, user, apiKey) as Record<string, unknown>
        data = {
          objection: requireStr(raw.objection, 500),
          type: requireStr(raw.type, 50),
          difficulty: requireOneOf(raw.difficulty, ['easy', 'medium', 'hard'] as const, 'medium'),
          context: requireStr(raw.context, 300),
        }
      }
      setObjection(data)
    } catch (err) {
      console.error(err)
      showToast('Something went wrong — please try again.', 'error')
    } finally {
      setLoadingObjection(false)
      setIsAIActive(false)
    }
  }

  async function handleScore() {
    if (!userReply.trim()) {
      showToast('Write your response first', 'info')
      return
    }
    if (!objection) return

    setLoadingScore(true)
    setIsAIActive(true)
    try {
      let data: ScoreResult
      if (!apiKey) {
        data = demoScore(userReply)
        showToast('Demo mode — add API key for AI output', 'info')
      } else {
        const sys = `You are a sales coach scoring a rep's objection response. Score 1-10 on empathy, reframe quality, value reinforcement, CTA strength. Give an overall score and specific improvement tips.\nRespond ONLY with valid JSON, no markdown fences:\n{"overall":<1-10>,"empathy":<1-10>,"reframe":<1-10>,"value":<1-10>,"cta":<1-10>,"feedback":"<2-3 sentences>","improved_version":"<a better version of their response>"}`
        const user = `Product being sold: ${product}\n\nObjection: "${objection.objection}"\n\nRep's response: "${userReply}"`
        const raw = await callGemini(sys, user, apiKey) as Record<string, unknown>
        data = {
          overall: requireNum(raw.overall, 1, 10),
          empathy: requireNum(raw.empathy, 1, 10),
          reframe: requireNum(raw.reframe, 1, 10),
          value: requireNum(raw.value, 1, 10),
          cta: requireNum(raw.cta, 1, 10),
          feedback: requireStr(raw.feedback, 500),
          improved_version: requireStr(raw.improved_version, 1000),
        }
      }
      setScore(data)
    } catch (err) {
      console.error(err)
      showToast('Something went wrong — please try again.', 'error')
    } finally {
      setLoadingScore(false)
      setIsAIActive(false)
    }
  }

  const difficultyColor: Record<string, string> = {
    easy: 'text-neural-secondary border-neural-secondary',
    medium: 'text-[#ffa502] border-[#ffa502]',
    hard: 'text-neural-accent border-neural-accent',
  }

  const scoreColor = (n: number) => n >= 7 ? 'text-neural-secondary' : n >= 5 ? 'text-neural-primary' : 'text-neural-accent'

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Form */}
      <div className="overflow-y-auto pr-2">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-primary text-xl">◉</span>
          <h2 className="font-display text-neural-text tracking-[0.15em]">OBJECTION SIMULATOR</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        <form onSubmit={handleGenerateObjection} className="flex flex-col gap-4" autoComplete="off">
          <Input label="Your Product" name="product" placeholder="AI sales engagement platform" required />
          <Input label="Prospect Persona" name="persona" placeholder="VP of Sales at a mid-market SaaS company" required />
          <Select label="Objection Scenario" name="scenario">
            <option value="random">Random (any type)</option>
            <option value="price">Price / Budget</option>
            <option value="timing">Timing / Not now</option>
            <option value="competitor">Using a competitor</option>
            <option value="authority">No authority to decide</option>
            <option value="need">Don't need it</option>
          </Select>
          <Button type="submit" loading={loadingObjection} className="mt-2 w-full justify-center">
            {loadingObjection ? 'SIMULATING...' : '◉ GENERATE OBJECTION'}
          </Button>
        </form>

        {/* Response area */}
        {objection && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="border-t border-neural-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-neural-primary font-display text-[10px] tracking-widest">› YOUR RESPONSE</span>
                <span className="flex-1 border-b border-dashed border-neural-border/50" />
              </div>
              <Textarea
                label="Handle the objection"
                rows={5}
                value={userReply}
                onChange={e => setUserReply(e.target.value)}
                placeholder="I completely understand your concern about pricing…"
              />
              <Button
                type="button"
                onClick={handleScore}
                loading={loadingScore}
                className="mt-3 w-full justify-center"
                variant="ghost"
              >
                {loadingScore ? 'SCORING...' : '⬡ SCORE MY RESPONSE'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Output */}
      <div className="overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neural-muted text-xl">◉</span>
          <h2 className="font-display text-neural-muted tracking-[0.15em]">SIMULATION STREAM</h2>
          <div className="flex-1 border-t border-neural-border" />
        </div>
        {!objection ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neural-border">
            <span className="text-4xl text-neural-border mb-3">◉</span>
            <p className="font-display text-neural-muted text-sm tracking-widest">AWAITING INPUT</p>
            <p className="font-mono text-neural-muted/50 text-xs mt-1">Generate an objection to practice</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Objection card */}
            <div className="border border-neural-accent/50 bg-neural-surface">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-accent/30 bg-neural-bg">
                <span className="text-neural-accent font-display text-[10px] tracking-widest">PROSPECT OBJECTION</span>
                <span className={`ml-auto text-[10px] font-display border px-1.5 py-0.5 ${difficultyColor[objection.difficulty] || difficultyColor.medium}`}>
                  [{objection.difficulty.toUpperCase()}]
                </span>
              </div>
              <div className="p-4">
                <p className="text-neural-text font-mono text-sm italic leading-relaxed">"{objection.objection}"</p>
              </div>
            </div>

            {/* Context */}
            <OutputCard title="objection_context" tag="[CTX]" content={objection.context} />

            {/* Score results */}
            {score && (
              <>
                <div className="border border-neural-border bg-neural-surface">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-neural-border bg-neural-bg">
                    <span className="text-neural-secondary font-display text-[10px] tracking-widest">YOUR SCORE</span>
                    <span className={`ml-auto text-2xl font-display font-bold ${scoreColor(score.overall)}`}>
                      {score.overall}/10
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {(['empathy', 'reframe', 'value', 'cta'] as const).map(key => (
                      <div key={key} className="flex items-center justify-between border border-neural-border px-3 py-2">
                        <span className="text-neural-muted font-display text-[10px] tracking-widest uppercase">{key}</span>
                        <span className={`font-mono text-sm font-bold ${scoreColor(score[key])}`}>{score[key]}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
                <OutputCard title="coach_feedback" tag="[FB]" content={score.feedback} variant="warning" typewriter />
                <OutputCard title="improved_version" tag="[IMP]" content={score.improved_version} variant="highlight" typewriter />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
