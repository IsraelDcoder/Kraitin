import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PaywallModal } from '@/components/common/PaywallModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { sendAiSearchRequest } from '@/lib/sse';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { FileCode2, Loader2, X, BookOpen } from 'lucide-react';
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard';
import { RecentTasks } from '@/components/intelligence/RecentTasks';
import { extractIntelligenceJSON, parseSSEChunk } from '@/components/intelligence/prompts';
import type { IntelligenceData } from '@/components/intelligence/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const EXAMPLE_IDEAS = [
  'AI-powered legal contract analyzer for SMBs',
  'Real-time mental health coaching app',
  'B2B cold outreach automation with AI',
  'Voice-based study coach for students',
  'Federated health data platform',
];

function buildBlueprintPrompt(idea: string): string {
  return `You are Kraitin, a world-class founder intelligence platform. Analyze the following startup idea from a STARTUP BLUEPRINT perspective — provide a complete actionable plan to outperform competitors and build a better version.

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
    { "label": "Feature Gap Score", "value": "<e.g. 87/100>" },
    { "label": "Differentiation", "value": "<e.g. Very High>" },
    { "label": "MVP Timeline", "value": "<e.g. 6-8 weeks>" },
    { "label": "Launch Readiness", "value": "<e.g. 9.1/10>" },
    { "label": "Pricing Power", "value": "<e.g. High>" },
    { "label": "Build Complexity", "value": "<e.g. Medium>" }
  ],
  "competitors": [
    { "name": "<competitor name>", "revenue": "<e.g. $1.8M MRR>", "downloads": "<e.g. 310K>", "growth": "<e.g. +38%>", "pricing": "<e.g. $29/mo>", "strength": <integer 30-95> }
  ],
  "painPoints": [
    { "text": "<unmet need competitors fail to address, max 10 words>", "severity": <integer 60-98>, "source": "<Reddit | App Store | Forums | G2>" }
  ],
  "lovedFeatures": [
    { "text": "<winning feature to build into MVP, max 8 words>", "score": <integer 60-98> }
  ],
  "marketGaps": [
    { "title": "<specific gap or whitespace, max 7 words>", "gapScore": <integer 60-95>, "difficulty": "<Easy | Medium | Hard>", "impact": "<High | Medium | Low>" }
  ],
  "monetization": [
    { "name": "<pricing model>", "stars": <integer 1-5>, "score": <integer 10-98> }
  ],
  "growthChannels": [
    { "name": "<GTM channel>", "potential": <integer 40-98>, "rec": "<Strong | Good | Test>" }
  ],
  "founderRec": {
    "verdict": "<YES | MAYBE | NO>",
    "confidence": <integer 50-98>,
    "buildTime": "<e.g. 6-8 weeks MVP>",
    "risk": "<Low | Medium | High>",
    "potential": "<Low | Medium | High | Very High>",
    "reasoning": "<2-3 sentence blueprint verdict: what to build first, who to target, how to position vs competitors. Max 200 words.>"
  },
  "aiAnalysis": "<full startup blueprint: competitive gaps, feature differentiation roadmap, MVP scope, pricing strategy, go-to-market channels, launch sequence, and 90-day execution plan. 400-600 words. This is the core blueprint essay.>"
}

Requirements:
- competitors: exactly 4-5 items — real companies in this space
- painPoints: exactly 5 items — actual unmet needs from real user complaints
- lovedFeatures: exactly 5 items — highest-leverage features for the MVP
- marketGaps: exactly 5 items — specific whitespace opportunities
- monetization: exactly 4-6 items — concrete pricing models
- growthChannels: exactly 5-6 items — specific GTM tactics
- Be specific. Use real company names, real pricing, real market data.
- Return ONLY the JSON. No text before or after.`;
}

export default function BlueprintAgentPage() {
  const { user, premiumAccess, profileReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get('q') || '');
  const [dashData, setDashData] = useState<IntelligenceData | null>(null);
  const [sources, setSources] = useState<Array<{ uri: string; title: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const bufRef = useRef('');
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoRun = useRef(false);

  const handleBlueprint = async (override?: string) => {
    const query = (override ?? idea).trim();
    if (!query) { toast.error('Please describe your startup idea'); return; }
    if (override) setIdea(override);

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    bufRef.current = '';
    setDashData(null); setSources([]); setIsStreaming(true); setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress((p) => p < 88 ? p + Math.random() * 4 : p);
    }, 400);

    const { data: { session } } = await supabase.auth.getSession();

    await sendAiSearchRequest({
      functionUrl: `${supabaseUrl}/functions/v1/ai-search`,
      contents: [{ role: 'user', parts: [{ text: buildBlueprintPrompt(query) }] }],
      credits: 10,
      supabaseAnonKey,
      accessToken: session?.access_token,
      signal: abortRef.current.signal,
      onData: (data) => {
        const { text, sources: s } = parseSSEChunk(data);
        if (text) bufRef.current += text;
        if (s.length) setSources(s);
      },
      onComplete: async () => {
        clearInterval(progressRef.current!);
        setProgress(100);
        setIsStreaming(false);
        const parsed = extractIntelligenceJSON(bufRef.current);
        if (parsed) {
          setDashData(parsed as IntelligenceData);
        } else {
          toast.error('Could not parse blueprint data. Please retry.');
        }
        if (user) {
          await supabase.from('reports').insert({
            user_id: user.id,
            title: `Blueprint: ${query.slice(0, 60)}`,
            type: 'blueprint',
            content: { idea: query, text: bufRef.current, json: parsed ?? undefined, generated: true },
            status: 'completed',
          });
        }
        toast.success('Startup blueprint ready!');
      },
      onError: (err) => {
        clearInterval(progressRef.current!);
        setIsStreaming(false);
        const msg = (err as Error).message || '';
        if (msg.includes('403') || msg.toLowerCase().includes('subscription')) {
          toast.error('Subscription required to use AI agents.');
        } else {
          toast.error('Blueprint generation failed. Please retry.');
        }
      },
    });
  };

  // Auto-trigger on ?q= — wait for auth to fully resolve (profileReady)
  useEffect(() => {
    if (!profileReady) return;
    if (!user) { navigate('/login'); return; }
    const q = searchParams.get('q');
    if (q && premiumAccess && !hasAutoRun.current) {
      hasAutoRun.current = true;
      setIdea(q);
      handleBlueprint(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileReady]);

  if (user && !premiumAccess) {
    return <AppLayout><PaywallModal feature="Blueprint Agent" onClose={() => navigate('/billing')} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center">
            <FileCode2 className="w-3.5 h-3.5 text-[#C5FF00]" />
          </div>
          <h1 className="text-xl font-black text-white">Blueprint Agent</h1>
          <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">AI</Badge>
        </div>

        {/* Sub-headline */}
        <p className="text-sm text-white/40 -mt-3">
          Generate a complete competitive blueprint — feature gaps, MVP scope, pricing strategy, and 90-day GTM plan.
        </p>

        {/* Input */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
          <label className="text-xs text-white/30 mb-2 block">Describe your startup idea</label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. An AI legal contract analyzer that outperforms Ironclad for SMBs…"
            className="bg-white/[0.03] border-white/[0.07] focus:border-[#C5FF00]/30 resize-none min-h-20 text-sm text-white/80 placeholder:text-white/20"
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleBlueprint(); }}
          />
          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
            <div className="flex gap-2 overflow-x-auto">
              {EXAMPLE_IDEAS.slice(0, 3).map((ex) => (
                <button key={ex} onClick={() => setIdea(ex)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.03] text-white/30 border border-white/[0.07] hover:text-white/60 hover:border-white/[0.15] transition-colors whitespace-nowrap shrink-0">
                  {ex.slice(0, 32)}…
                </button>
              ))}
            </div>
            <div className="flex gap-2 shrink-0">
              {isStreaming && (
                <Button size="sm" variant="ghost"
                  onClick={() => { abortRef.current?.abort(); clearInterval(progressRef.current!); setIsStreaming(false); }}
                  className="h-9 text-xs border border-white/[0.1] text-white/40 hover:text-white/60">
                  <X className="w-3.5 h-3.5 mr-1" /> Stop
                </Button>
              )}
              <button
                onClick={() => handleBlueprint()}
                disabled={isStreaming || !idea.trim()}
                className="flex items-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {isStreaming
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Building Blueprint…</>
                  : <><FileCode2 className="w-3.5 h-3.5" /> Generate Blueprint</>}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard or empty state */}
        {(isStreaming || dashData) ? (
          <IntelligenceDashboard
            data={dashData ?? {} as IntelligenceData}
            isLoading={isStreaming}
            progress={progress}
            sources={sources}
            idea={idea}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center">
              <FileCode2 className="w-6 h-6 text-[#C5FF00]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-white/70">Blueprint dashboard awaits</p>
              <p className="text-xs text-white/30 max-w-sm">
                Enter any startup idea above to get a full competitive blueprint — feature gaps, MVP roadmap, pricing strategy, and 90-day GTM plan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Feature Gap Analysis', 'Competitive Differentiation', 'MVP Roadmap', 'Pricing Strategy', 'GTM Plan'].map((tag) => (
                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.07] text-white/30">{tag}</span>
              ))}
            </div>
            <Link to="/docs#blueprint" className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-[#C5FF00]/70 transition-colors">
              <BookOpen className="w-3 h-3" /> How to use Blueprint Generator
            </Link>
            <RecentTasks reportType="blueprint" userId={user?.id} label="Recent Blueprints" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
