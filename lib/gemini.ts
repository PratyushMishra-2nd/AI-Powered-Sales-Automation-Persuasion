export async function callGemini(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 1200 },
      }),
    }
  )
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    console.error('Gemini API error:', e)
    throw new Error('AI request failed — check your API key.')
  }
  const j = await res.json()
  const raw: string = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''))
  } catch (err) {
    console.error('Failed to parse AI response:', raw, err)
    throw new Error('AI returned an unexpected format — please try again.')
  }
}

export interface SearchResult {
  text: string
  queries: string[]
  sources: Array<{ title: string; uri: string }>
}

/**
 * Calls Gemini with Google Search grounding enabled.
 * Uses the google_search tool so Gemini can retrieve live web data
 * about the prospect/company before generating content.
 */
export async function callGeminiWithSearch(
  query: string,
  apiKey: string
): Promise<SearchResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      }),
    }
  )
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    console.error('Gemini Search error:', e)
    throw new Error('Research failed — check your API key.')
  }
  const j = await res.json()
  const parts: Array<{ text?: string }> = j.candidates?.[0]?.content?.parts ?? []
  const text = parts.map(p => p.text ?? '').join('').trim()
  const meta = j.candidates?.[0]?.groundingMetadata ?? {}
  const queries: string[] = meta.webSearchQueries ?? []
  const sources: Array<{ title: string; uri: string }> = (meta.groundingChunks ?? [])
    .filter((c: { web?: { title?: string; uri?: string } }) => c.web)
    .slice(0, 4)
    .map((c: { web: { title?: string; uri?: string } }) => ({
      title: c.web.title ?? '',
      uri: c.web.uri ?? '',
    }))
  return { text, queries, sources }
}
