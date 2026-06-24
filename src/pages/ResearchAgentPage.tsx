import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PaywallModal } from '@/components/common/PaywallModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { sendAiSearchRequest } from '@/lib/sse';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Zap, Loader2, X } from 'lucide-react';
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard';
import { RecentTasks } from '@/components/intelligence/RecentTasks';
import { buildIntelligencePrompt, extractIntelligenceJSON, parseSSEChunk } from '@/components/intelligence/prompts';
import type { IntelligenceData } from '@/components/intelligence/types';

const EXAMPLE_IDEAS = [
  'AI meal scanner app that tracks nutrition',
  'Voice-based study coach for students',
  'AI legal document review for small businesses',
  'AI companion app for seniors',
  'B2B cold outreach automation with AI',
];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function ResearchAgentPage() {
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

  const handleAnalyze = async (override?: string) => {
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
      contents: [{ role: 'user', parts: [{ text: buildIntelligencePrompt(query, 'comprehensive market research') }] }],
      credits: 5,
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
          toast.error('Could not parse intelligence data. Please retry.');
        }
        if (user) {
          await supabase.from('reports').insert({
            user_id: user.id,
            title: `Research: ${query.slice(0, 60)}`,
            type: 'research',
            content: { idea: query, text: bufRef.current, json: parsed ?? undefined, generated: true },
            status: 'completed',
          });
        }
        toast.success('Research dashboard ready!');
      },
      onError: (err) => {
        clearInterval(progressRef.current!);
        setIsStreaming(false);
        const msg = (err as Error).message || '';
        if (msg.includes('403') || msg.toLowerCase().includes('subscription')) {
          toast.error('Subscription required to use AI agents.');
        } else {
          toast.error('Analysis failed. Please retry.');
        }
      },
    });
  };

  // Auto-trigger when arriving via ?q= param — wait for auth to fully resolve first
  useEffect(() => {
    if (!profileReady) return;
    if (!user) { navigate('/login'); return; }
    const q = searchParams.get('q');
    if (q && premiumAccess && !hasAutoRun.current) {
      hasAutoRun.current = true;
      setIdea(q);
      handleAnalyze(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileReady]);

  if (user && !premiumAccess) {
    return <AppLayout><PaywallModal feature="Research Agent" onClose={() => navigate('/billing')} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#C5FF00]" />
          </div>
          <h1 className="text-xl font-black text-white">Research Agent</h1>
          <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">AI</Badge>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
          <label className="text-xs text-white/30 mb-2 block">Describe your startup idea</label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. An AI meal scanner app that tracks nutrition and suggests meal plans…"
            className="bg-white/[0.03] border-white/[0.07] focus:border-[#C5FF00]/30 resize-none min-h-20 text-sm text-white/80 placeholder:text-white/20"
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAnalyze(); }}
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
                onClick={() => handleAnalyze()}
                disabled={isStreaming || !idea.trim()}
                className="flex items-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {isStreaming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : <><Zap className="w-3.5 h-3.5" /> Analyze Idea</>}
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
            onActionNavigate={(path, q) => navigate(`${path}?q=${encodeURIComponent(q)}`)}
          />
        ) : (
          <div className="space-y-8">
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-[#C5FF00]" />
              </div>
              <h3 className="text-base font-bold text-white/60 mb-2 text-balance">Intelligence dashboard awaits</h3>
              <p className="text-sm text-white/25 max-w-sm mx-auto text-pretty">
                Enter any startup idea above and get a full intelligence dashboard — scores, competitors, market gaps, and founder recommendations.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {EXAMPLE_IDEAS.map((ex) => (
                  <button key={ex} onClick={() => setIdea(ex)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.15] transition-all">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
            <RecentTasks reportType="research" userId={user?.id} label="Recent Research" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
