export interface OutreachResult {
  subject: string
  body: string
  followup: string
}

export interface ABVariant {
  angle: string
  subject: string
  body: string
  prediction: 'best' | 'good' | 'ok'
}

export interface ABTestResult {
  variants: ABVariant[]
  analysis: string
}

export interface ResponseAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  signals: string[]
  intent: string
  urgency: number
  analysis: string
  suggested_reply: string
}

export interface ObjectionResult {
  objection: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  context: string
}

export interface ScoreResult {
  overall: number
  empathy: number
  reframe: number
  value: number
  cta: number
  feedback: string
  improved_version: string
}

export interface CallPrepResult {
  summary: string
  openers: string[]
  talking_points: string[]
  objections: { objection: string; rebuttal: string }[]
  competitive_intel: string
  questions: string[]
}

export type ToolId = 'outreach' | 'ab' | 'response' | 'objection' | 'callprep'
