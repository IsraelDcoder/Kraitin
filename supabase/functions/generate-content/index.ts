import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LLM_ENDPOINT =
  'https://app-ciobakqmqcjl-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

interface Opportunity {
  id: string;
  title: string;
  category: string;
  opportunity_score: number | null;
  market_size: string | null;
  revenue_estimate: string | null;
  growth_percent: number | null;
  description: string | null;
  tags: string[];
}

function buildPrompt(
  platform: string,
  tone: string,
  opp: Opportunity,
): string {
  const score = opp.opportunity_score ?? 'N/A';
  const market = opp.market_size ?? 'a large addressable market';
  const revenue = opp.revenue_estimate ?? 'strong revenue potential';
  const growth = opp.growth_percent != null ? `+${opp.growth_percent}%` : 'fast growing';
  const tags = (opp.tags ?? []).join(', ') || opp.category;
  const desc = opp.description ?? `${opp.title} is a high-potential startup opportunity in the ${opp.category} space.`;

  const toneGuide: Record<string, string> = {
    data_driven:  'Use specific numbers, metrics, and data points. Be analytical and precise.',
    founder_story:'Write from a personal, first-person narrative perspective. Be relatable and human.',
    hot_take:     'Be contrarian and opinionated. Make a bold, provocative claim that challenges conventional wisdom.',
    educational:  'Teach a framework or process. Use numbered steps and clear takeaways.',
  };

  const toneInstruction = toneGuide[tone] ?? toneGuide['data_driven'];

  if (platform === 'twitter_thread') {
    return `You are a viral startup content writer. Write a 7-tweet Twitter thread showcasing the following startup opportunity.

OPPORTUNITY DATA:
- Title: ${opp.title}
- Category: ${opp.category}
- Opportunity Score: ${score}/100
- Market Size: ${market}
- Revenue Estimate: ${revenue}
- Growth Rate: ${growth}
- Tags: ${tags}
- Description: ${desc}

TONE: ${toneInstruction}

FORMAT REQUIREMENTS:
- Write exactly 7 tweets
- Each tweet must be under 280 characters
- Separate each tweet with a line containing only "---"
- Tweet 1: Hook — a bold claim or shocking stat to grab attention
- Tweet 2: The market size and why it matters now
- Tweet 3: The problem — what's broken with existing solutions
- Tweet 4: The opportunity — what the winning product looks like
- Tweet 5: Revenue model and customer profile
- Tweet 6: Risk and how to mitigate it
- Tweet 7: CTA — encourage readers to discover more opportunities on KRAITIN

IMPORTANT: Output only the 7 tweets separated by "---". No numbering, no labels, no extra explanation.`;
  }

  if (platform === 'twitter_hot_take') {
    return `You are a viral startup content writer. Write ONE single punchy tweet about the following startup opportunity.

OPPORTUNITY DATA:
- Title: ${opp.title}
- Category: ${opp.category}
- Opportunity Score: ${score}/100
- Market Size: ${market}
- Growth Rate: ${growth}

TONE: ${toneInstruction}

FORMAT REQUIREMENTS:
- Single tweet, under 280 characters
- Start with a hook (bold claim, surprising stat, or contrarian take)
- End with a subtle CTA or KRAITIN mention
- No hashtags, no emojis spam

IMPORTANT: Output only the single tweet text. Nothing else.`;
  }

  if (platform === 'linkedin_longform') {
    return `You are a startup thought leader writing on LinkedIn. Write a long-form LinkedIn post about the following startup opportunity.

OPPORTUNITY DATA:
- Title: ${opp.title}
- Category: ${opp.category}
- Opportunity Score: ${score}/100
- Market Size: ${market}
- Revenue Estimate: ${revenue}
- Growth Rate: ${growth}
- Tags: ${tags}
- Description: ${desc}

TONE: ${toneInstruction}

FORMAT REQUIREMENTS:
- 300–600 words
- Start with a single bold hook line (no intro fluff)
- Use short paragraphs (2–3 sentences max)
- Include a 4-part framework or structured analysis woven around the opportunity data
- End with a CTA directing readers to KRAITIN to find their own opportunity
- No hashtag block at the end (max 2 subtle inline hashtags if needed)
- Professional but human tone

IMPORTANT: Output only the post text. No subject line, no labels.`;
  }

  if (platform === 'linkedin_carousel') {
    return `You are a startup content strategist. Write a LinkedIn carousel post caption for the following startup opportunity.

OPPORTUNITY DATA:
- Title: ${opp.title}
- Category: ${opp.category}
- Opportunity Score: ${score}/100
- Market Size: ${market}
- Revenue Estimate: ${revenue}
- Growth Rate: ${growth}
- Tags: ${tags}

TONE: ${toneInstruction}

FORMAT REQUIREMENTS:
- Line 1: A punchy hook headline (the carousel cover text), all caps, under 60 chars
- Then exactly 5 bullet points, each starting with an emoji and being under 120 chars
- Each bullet = one data-backed insight about this opportunity
- Final line: CTA directing to KRAITIN

IMPORTANT: Output only the caption text in this exact structure. No extra labels or explanation.`;
  }

  return `Write a compelling social media post about this startup opportunity: ${opp.title} in ${opp.category}. Score: ${score}/100. Market: ${market}. Growth: ${growth}. Tone: ${toneInstruction}.`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify user
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Parse request
  let platform: string, tone: string, opportunity: Opportunity;
  try {
    const body = await req.json();
    platform = body.platform;
    tone = body.tone;
    opportunity = body.opportunity;
    if (!platform || !tone || !opportunity?.id) throw new Error('Missing fields');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildPrompt(platform, tone, opportunity);

  const upstream = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(upstream.body, {
    headers: {
      ...CORS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
