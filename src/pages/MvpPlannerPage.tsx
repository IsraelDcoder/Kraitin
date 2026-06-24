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
import { Code2, Loader2, X, BookOpen } from 'lucide-react';
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard';
import { RecentTasks } from '@/components/intelligence/RecentTasks';
import { buildIntelligencePrompt, extractIntelligenceJSON, parseSSEChunk } from '@/components/intelligence/prompts';
import type { IntelligenceData } from '@/components/intelligence/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function MvpPlannerPage() {
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

  const handleGenerate = async (override?: string) => {
    const q = (override ?? idea).trim();
    if (!q) { toast.error('Please describe your idea'); return; }
    if (override) setIdea(override);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    bufRef.current = '';
    setDashData(null); setSources([]); setIsStreaming(true); setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress((p) => p < 88 ? p + Math.random() * 4 : p);
    }, 400);

    const { data: { session } } = await supabase.auth.getSession();
    const queryText = q;

    await sendAiSearchRequest({
      functionUrl: `${supabaseUrl}/functions/v1/ai-search`,
      contents: [{ role: 'user', parts: [{ text: buildIntelligencePrompt(queryText, 'MVP planning — feature scope, build difficulty, technical architecture, launch readiness') }] }],
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
          toast.error('Could not parse MVP data. Please retry.');
        }
        if (user) {
          await supabase.from('reports').insert({
            user_id: user.id,
            title: `MVP Plan: ${queryText.slice(0, 60)}`,
            type: 'mvp',
            content: { idea: queryText, text: bufRef.current, json: parsed ?? undefined, generated: true },
            status: 'completed',
          });
        }
        toast.success('MVP dashboard ready!');
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

  // Auto-trigger on ?q= param — wait for auth to fully resolve (profileReady)
  useEffect(() => {
    if (!profileReady) return;
    if (!user) { navigate('/login'); return; }
    const q = searchParams.get('q');
    if (q && premiumAccess && !hasAutoRun.current) {
      hasAutoRun.current = true;
      setIdea(q);
      handleGenerate(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileReady]);

  if (user && !premiumAccess) {
    return <AppLayout><PaywallModal feature="MVP Planner" onClose={() => navigate('/billing')} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <h1 className="text-xl font-black text-white">MVP Planner</h1>
          <Badge className="text-[10px] bg-violet-400/10 text-violet-400 border-violet-400/20">AI</Badge>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
          <label className="text-xs text-white/30 mb-2 block">Describe your startup idea</label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. An AI meal scanner that tracks nutrition and suggests meal plans…"
            className="bg-white/[0.03] border-white/[0.07] focus:border-violet-400/30 resize-none min-h-20 text-sm text-white/80 placeholder:text-white/20"
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
              onClick={() => handleGenerate()}
              disabled={isStreaming || !idea.trim()}
              className="flex items-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-500/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isStreaming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Planning…</> : <><Code2 className="w-3.5 h-3.5" /> Generate MVP Plan</>}
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
              <div className="w-14 h-14 rounded-2xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center mx-auto mb-4">
                <Code2 className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-base font-bold text-white/60 mb-2 text-balance">Plan your MVP intelligently</h3>
              <p className="text-sm text-white/25 max-w-sm mx-auto text-pretty">
                Get a complete MVP intelligence dashboard — build difficulty, feature gaps, competitor positioning, and a go/no-go recommendation.
              </p>
              <Link to="/docs#mvp-planner" className="inline-flex items-center gap-1.5 mt-5 text-xs text-white/25 hover:text-violet-400/70 transition-colors">
                <BookOpen className="w-3 h-3" /> How to use MVP Planner
              </Link>
            </div>
            <RecentTasks reportType="mvp" userId={user?.id} label="Recent MVP Plans" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

