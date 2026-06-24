/**
 * Shared prompt builder for all Intelligence Agent pages.
 * Returns a prompt asking the AI to produce a structured JSON payload
 * that can be directly rendered by IntelligenceDashboard.
 */
export function buildIntelligencePrompt(idea: string, focus: string): string {
  return `You are Kraitin, a world-class founder intelligence platform. Analyze the following startup idea from a ${focus} perspective.

STARTUP IDEA: "${idea}"

Return ONLY a valid JSON object (no markdown, no explanation outside the JSON) with this EXACT structure:

{
  "title": "<concise product name, max 5 words>",
  "opportunityScore": <integer 0-100>,
  "revenuePotential": "<e.g. $2.3M MRR>",
  "marketDemand": <integer 0-100>,
  "competition": "<Low | Medium | High>",
  "difficulty": <integer 1-10>,
  "recommendation": "<STRONG BUY | BUY | WATCH | PASS>",
  "metrics": [
    { "label": "Market Size", "value": "<e.g. $2.4B>" },
    { "label": "Growth Rate", "value": "<e.g. +47%>" },
    { "label": "Search Demand", "value": "<e.g. 92/100>" },
    { "label": "Monetization", "value": "<e.g. 9.4/10>" },
    { "label": "Competition", "value": "<e.g. Medium>" },
    { "label": "MVP Difficulty", "value": "<e.g. 6/10>" }
  ],
  "competitors": [
    { "name": "<name>", "revenue": "<e.g. $2.3M MRR>", "downloads": "<e.g. 420K>", "growth": "<e.g. +47%>", "pricing": "<e.g. $9.99/week>", "strength": <integer 30-95> }
  ],
  "painPoints": [
    { "text": "<complaint, max 10 words>", "severity": <integer 60-98>, "source": "<Reddit | App Store | Forums>" }
  ],
  "lovedFeatures": [
    { "text": "<feature, max 8 words>", "score": <integer 60-98> }
  ],
  "marketGaps": [
    { "title": "<gap, max 7 words>", "gapScore": <integer 60-95>, "difficulty": "<Easy | Medium | Hard>", "impact": "<High | Medium | Low>" }
  ],
  "monetization": [
    { "name": "<model name>", "stars": <integer 1-5>, "score": <integer 10-98> }
  ],
  "growthChannels": [
    { "name": "<channel>", "potential": <integer 40-98>, "rec": "<Strong | Good | Test>" }
  ],
  "founderRec": {
    "verdict": "<YES | MAYBE | NO>",
    "confidence": <integer 50-98>,
    "buildTime": "<e.g. 4-6 weeks>",
    "risk": "<Low | Medium | High>",
    "potential": "<Low | Medium | High | Very High>",
    "reasoning": "<2-3 sentence honest YC-partner-style analysis, max 200 words>"
  },
  "aiAnalysis": "<detailed analysis: market context, competitive dynamics, key risks, monetization path, go-to-market insights. 300-500 words. This is the essay — put all long-form content here.>"
}

Requirements:
- competitors: exactly 4-5 items
- painPoints: exactly 5 items
- lovedFeatures: exactly 5 items
- marketGaps: exactly 5 items
- monetization: exactly 4-6 items
- growthChannels: exactly 5-6 items
- Be specific and data-driven. Use real market knowledge.
- Return ONLY the JSON. No text before or after.`;
}

/** Extract the first valid JSON object from an AI response.
 *  Handles: plain JSON, markdown code fences (```json ... ```),
 *  preamble text before the JSON block, and trailing commentary after it.
 */
export function extractIntelligenceJSON(raw: string) {
  if (!raw || typeof raw !== 'string') return null;

  // 1. If the whole string is valid JSON, return immediately
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch { /* continue */ }

  // 2. Strip markdown code fence wrappers: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }

  // 3. Find the outermost balanced { } block — handles preamble/postamble text
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return null;
  const candidate = raw.slice(start, end + 1);
  try { return JSON.parse(candidate); } catch { /* continue */ }

  // 4. Last resort: aggressively strip control characters and retry
  try { return JSON.parse(candidate.replace(/[\u0000-\u001F\u007F]/g, ' ')); } catch { return null; }
}

/** Parse raw SSE candidate chunk and return text + sources */
export function parseSSEChunk(data: string): { text: string; sources: Array<{ uri: string; title: string }> } {
  try {
    const parsed = JSON.parse(data);
    const candidate = parsed?.candidates?.[0];
    if (!candidate) return { text: '', sources: [] };
    const text = candidate?.content?.parts?.[0]?.text ?? '';
    const meta = candidate?.groundingMetadata;
    const sources = meta?.groundingChunks
      ? (meta.groundingChunks as Array<{ web: { uri: string; title: string } }>)
          .filter((c) => c?.web?.uri)
          .map((c) => ({ uri: c.web.uri, title: c.web.title ?? c.web.uri }))
      : [];
    return { text, sources };
  } catch {
    return { text: '', sources: [] };
  }
}
