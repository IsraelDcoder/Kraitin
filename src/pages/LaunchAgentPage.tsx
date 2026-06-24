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
import { Rocket, Loader2, X, BookOpen } from 'lucide-react';
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard';
import { RecentTasks } from '@/components/intelligence/RecentTasks';
import { buildIntelligencePrompt, extractIntelligenceJSON, parseSSEChunk } from '@/components/intelligence/prompts';
import type { IntelligenceData } from '@/components/intelligence/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function LaunchAgentPage() {
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

  // Auto-trigger on ?q= param — wait for auth to fully resolve (profileReady)
  useEffect(() => {
    if (!profileReady) return;
    if (!user) { navigate('/login'); return; }
    const q = searchParams.get('q');
    if (q && premiumAccess && !hasAutoRun.current) {
      hasAutoRun.current = true;
      setIdea(q);
      handleLaunch(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileReady]);

  if (user && !premiumAccess) {
    return <AppLayout><PaywallModal feature="Launch Agent" onClose={() => navigate('/billing')} /></AppLayout>;
  }

  const handleLaunch = async (override?: string) => {
    const query = (override ?? idea).trim();
    if (!query) { toast.error('Please describe your startup'); return; }
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
      contents: [{ role: 'user', parts: [{ text: buildIntelligencePrompt(query, 'launch strategy — growth channels, SEO, TikTok, ASO, influencer marketing, paid acquisition') }] }],
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
          toast.error('Could not parse launch data. Please retry.');
        }
        if (user) {
          await supabase.from('reports').insert({
            user_id: user.id,
            title: `Launch Plan: ${query.slice(0, 60)}`,
            type: 'launch',
            content: { idea: query, text: bufRef.current, json: parsed ?? undefined, generated: true },
            status: 'completed',
          });
        }
        toast.success('Launch dashboard ready!');
      },
      onError: (err) => {
        clearInterval(progressRef.current!);
        setIsStreaming(false);
        const msg = (err as Error).message || '';
        if (msg.includes('403') || msg.toLowerCase().includes('subscription')) {
          toast.error('Subscription required to use AI agents.');
        } else {
          toast.error('Generation failed. Please retry.');
        }
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h1 className="text-xl font-black text-white">Launch Agent</h1>
          <Badge className="text-[10px] bg-orange-400/10 text-orange-400 border-orange-400/20">AI</Badge>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
          <label className="text-xs text-white/30 mb-2 block">Describe your startup</label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. An AI meal scanner app targeting health-conscious 25-40 year olds in the US…"
            className="bg-white/[0.03] border-white/[0.07] focus:border-orange-400/30 resize-none min-h-20 text-sm text-white/80 placeholder:text-white/20"
          />
          <div className="flex justify-end mt-3 gap-2">
            {isStreaming && (
              <Button size="sm" variant="ghost"
                onClick={() => { abortRef.current?.abort(); clearInterval(progressRef.current!); setIsStreaming(false); }}
                className="h-9 text-xs border border-white/[0.1] text-white/40 hover:text-white/60">
                <X className="w-3.5 h-3.5 mr-1" /> Stop
              </Button>
            )}
            <button
              onClick={() => handleLaunch()}
              disabled={isStreaming || !idea.trim()}
              className="flex items-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-500/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isStreaming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Rocket className="w-3.5 h-3.5" /> Generate Launch Plan</>}
            </button>
          </div>
        </div>

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
              <div className="w-14 h-14 rounded-2xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-base font-bold text-white/60 mb-2 text-balance">Launch with intelligence</h3>
              <p className="text-sm text-white/25 max-w-sm mx-auto text-pretty">
                Get a complete launch intelligence dashboard — growth channels, channel scores, competitor positioning, and a data-driven launch verdict.
              </p>
              <Link to="/docs#launch-agent" className="inline-flex items-center gap-1.5 mt-5 text-xs text-white/25 hover:text-orange-400/70 transition-colors">
                <BookOpen className="w-3 h-3" /> How to use Launch Agent
              </Link>
            </div>
            <RecentTasks reportType="launch" userId={user?.id} label="Recent Launch Strategies" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

