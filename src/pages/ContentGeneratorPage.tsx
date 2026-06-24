import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumSection } from '@/components/paywall/PremiumSection';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/types';
import {
  Search, Twitter, Linkedin, Zap, Copy, RefreshCw,
  BookmarkPlus, CheckCircle2, Trash2, ChevronDown, ChevronUp,
  PenLine, BarChart3, Loader2, Check, Calendar, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ── Types ─────────────────────────────────────────────────── */
type Platform = 'twitter_thread' | 'twitter_hot_take' | 'linkedin_longform' | 'linkedin_carousel';
type Tone     = 'data_driven' | 'founder_story' | 'hot_take' | 'educational';
type DraftStatus = 'draft' | 'posted';

interface ContentDraft {
  id: string;
  opportunity_id: string | null;
  platform: Platform;
  tone: Tone;
  content: string;
  status: DraftStatus;
  scheduled_for: string | null;
  created_at: string;
  opportunities?: { title: string } | null;
}

/* ── Constants ─────────────────────────────────────────────── */
const PLATFORMS: { value: Platform; label: string; icon: React.ElementType; sub: string; charLimit: number }[] = [
  { value: 'twitter_thread',   label: 'Twitter Thread',    icon: Twitter,  sub: '7-tweet showcase',      charLimit: 280 },
  { value: 'twitter_hot_take', label: 'Twitter Hot Take',  icon: Twitter,  sub: 'Single punchy tweet',   charLimit: 280 },
  { value: 'linkedin_longform',label: 'LinkedIn Long-form',icon: Linkedin, sub: 'Framework analysis',    charLimit: 3000 },
  { value: 'linkedin_carousel',label: 'LinkedIn Carousel', icon: Linkedin, sub: 'Hook + bullets + CTA',  charLimit: 3000 },
];

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: 'data_driven',   label: 'Data-driven',    desc: 'Facts, numbers, metrics'       },
  { value: 'founder_story', label: 'Founder Story',  desc: 'Personal, narrative'           },
  { value: 'hot_take',      label: 'Hot Take',       desc: 'Contrarian, opinionated'       },
  { value: 'educational',   label: 'Educational',    desc: 'Frameworks, how-to'            },
];

const PLATFORM_LABELS: Record<Platform, string> = {
  twitter_thread:    'Twitter Thread',
  twitter_hot_take:  'Twitter Hot Take',
  linkedin_longform: 'LinkedIn Long-form',
  linkedin_carousel: 'LinkedIn Carousel',
};

const TONE_LABELS: Record<Tone, string> = {
  data_driven:   'Data-driven',
  founder_story: 'Founder Story',
  hot_take:      'Hot Take',
  educational:   'Educational',
};

/* ── Helpers ───────────────────────────────────────────────── */
function splitTweets(content: string): string[] {
  return content.split(/\n---\n/).map(t => t.trim()).filter(Boolean);
}

function charCount(text: string) { return [...text].length; }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy}
      className="p-1.5 rounded text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-[#C5FF00]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function ContentGeneratorPage() {
  const { user, premiumAccess } = useAuth();

  // Opportunity selector state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppsLoading, setOppsLoading]     = useState(true);
  const [search, setSearch]               = useState('');
  const [catFilter, setCatFilter]         = useState('All');
  const [selectedOpp, setSelectedOpp]     = useState<Opportunity | null>(null);

  // Generator state
  const [platform, setPlatform] = useState<Platform>('twitter_thread');
  const [tone, setTone]         = useState<Tone>('data_driven');
  const [content, setContent]   = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Drafts state
  const [drafts, setDrafts]                 = useState<ContentDraft[]>([]);
  const [draftsLoading, setDraftsLoading]   = useState(false);
  const [expandedDraft, setExpandedDraft]   = useState<string | null>(null);
  const [savingDraft, setSavingDraft]       = useState(false);
  const [scheduledFor, setScheduledFor]     = useState('');           // ISO date string for new draft
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null); // draft id being edited
  const [editScheduleVal, setEditScheduleVal] = useState('');         // value in the inline editor

  /* Load opportunities */
  useEffect(() => {
    (async () => {
      setOppsLoading(true);
      const { data } = await supabase
        .from('opportunities')
        .select('id,title,category,opportunity_score,market_size,revenue_estimate,growth_percent,description,tags,is_hidden_gem,growth_velocity,downloads,created_at')
        .order('opportunity_score', { ascending: false })
        .limit(200);
      setOpportunities(Array.isArray(data) ? (data as unknown as Opportunity[]) : []);
      setOppsLoading(false);
    })();
  }, []);

  /* Load drafts */
  const loadDrafts = useCallback(async () => {
    if (!user) return;
    setDraftsLoading(true);
    const { data } = await supabase
      .from('content_drafts')
      .select('id,opportunity_id,platform,tone,content,status,scheduled_for,created_at,opportunities(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setDrafts(Array.isArray(data) ? (data as unknown as ContentDraft[]) : []);
    setDraftsLoading(false);
  }, [user]);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  /* Derived data */
  const categories = ['All', ...Array.from(new Set(opportunities.map(o => o.category))).sort()];
  const filteredOpps = opportunities.filter(o => {
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All' || o.category === catFilter;
    return matchSearch && matchCat;
  });

  /* Generate */
  const generate = async (overrideOpp?: Opportunity) => {
    const opp = overrideOpp ?? selectedOpp;
    if (!opp) { toast.error('Select an opportunity first'); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setContent('');
    setIsStreaming(true);

    const supabaseUrl   = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnon  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? supabaseAnon;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnon,
        },
        body: JSON.stringify({ platform, tone, opportunity: opp }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Generation failed (${res.status})`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const frame = JSON.parse(raw);
            const chunk = frame?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (chunk) setContent(prev => prev + chunk);
          } catch { /* incomplete frame */ }
        }
      }
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        toast.error('Generation failed. Please try again.');
      }
    } finally {
      setIsStreaming(false);
    }
  };

  /* Save draft */
  const saveDraft = async () => {
    if (!content.trim()) { toast.error('Nothing to save — generate content first'); return; }
    if (!user)           { toast.error('You must be logged in'); return; }
    setSavingDraft(true);
    const { error } = await supabase.from('content_drafts').insert({
      user_id:        user.id,
      opportunity_id: selectedOpp?.id ?? null,
      platform,
      tone,
      content,
      status: 'draft',
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    });
    if (error) { toast.error('Failed to save draft'); }
    else        { toast.success('Draft saved'); setScheduledFor(''); loadDrafts(); }
    setSavingDraft(false);
  };

  /* Update schedule for existing draft */
  const saveSchedule = async (id: string) => {
    const iso = editScheduleVal ? new Date(editScheduleVal).toISOString() : null;
    const { error } = await supabase
      .from('content_drafts')
      .update({ scheduled_for: iso })
      .eq('id', id);
    if (error) { toast.error('Failed to update schedule'); }
    else {
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, scheduled_for: iso } : d));
      toast.success(iso ? 'Schedule saved' : 'Schedule cleared');
    }
    setEditingSchedule(null);
  };

  /* Mark posted */
  const markPosted = async (id: string) => {
    await supabase.from('content_drafts').update({ status: 'posted' }).eq('id', id);
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'posted' } : d));
    toast.success('Marked as posted');
  };

  /* Delete draft */
  const deleteDraft = async (id: string) => {
    await supabase.from('content_drafts').delete().eq('id', id);
    setDrafts(prev => prev.filter(d => d.id !== id));
    toast.success('Draft deleted');
  };

  /* Render content preview */
  const renderContent = () => {
    if (!content) return null;
    if (platform === 'twitter_thread') {
      const tweets = splitTweets(content);
      return (
        <div className="space-y-3">
          {tweets.map((tweet, i) => {
            const len = charCount(tweet);
            const over = len > 280;
            return (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[10px] font-mono text-white/20">Tweet {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-mono', over ? 'text-red-400' : 'text-white/25')}>
                      {len}/280
                    </span>
                    <CopyButton text={tweet} />
                  </div>
                </div>
                <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{tweet}</p>
              </div>
            );
          })}
        </div>
      );
    }
    const len  = charCount(content);
    const limit = platform.startsWith('linkedin') ? 3000 : 280;
    const over  = len > limit;
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={cn('text-[10px] font-mono', over ? 'text-red-400' : 'text-white/25')}>
            {len}/{limit} characters
          </span>
          <CopyButton text={content} />
        </div>
        <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    );
  };

  const GeneratorContent = () => (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">

      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <PenLine className="w-5 h-5 text-[#C5FF00]" />
          <h1 className="text-xl font-black tracking-tight text-white">Content Generator</h1>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C5FF00]/10 text-[#C5FF00]/70 font-mono border border-[#C5FF00]/15">AI</span>
        </div>
        <p className="text-sm text-white/35">Generate ready-to-post Twitter and LinkedIn content from live opportunity data.</p>
      </div>

      {/* 1. Opportunity Selector */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">1 — Select Opportunity</h2>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          {/* Search + filter row */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search opportunities…"
                className="pl-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 text-sm h-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.slice(0, 7).map(cat => (
                <button key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={cn('h-9 px-3 rounded-lg text-xs font-medium border transition-all',
                    catFilter === cat
                      ? 'border-[#C5FF00]/30 text-[#C5FF00] bg-[#C5FF00]/[0.06]'
                      : 'border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/20')}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunity list */}
          {oppsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-white/20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredOpps.slice(0, 40).map(opp => (
                <button key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className={cn('text-left p-3 rounded-xl border transition-all',
                    selectedOpp?.id === opp.id
                      ? 'border-[#C5FF00]/30 bg-[#C5FF00]/[0.05]'
                      : 'border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.02]')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold leading-tight text-balance',
                      selectedOpp?.id === opp.id ? 'text-white' : 'text-white/65')}>{opp.title}</p>
                    {selectedOpp?.id === opp.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00] shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] border-white/[0.08] text-white/30 px-1.5 py-0">{opp.category}</Badge>
                    {opp.opportunity_score != null && (
                      <span className="text-[10px] font-mono text-[#C5FF00]/60">{opp.opportunity_score}/100</span>
                    )}
                    {opp.market_size && (
                      <span className="text-[10px] text-white/25 truncate">{opp.market_size}</span>
                    )}
                  </div>
                </button>
              ))}
              {filteredOpps.length === 0 && (
                <div className="col-span-2 text-center py-8 text-white/20 text-sm">No opportunities match</div>
              )}
            </div>
          )}

          {selectedOpp && (
            <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00]" />
              <span className="text-xs text-[#C5FF00]">Selected: <span className="font-semibold">{selectedOpp.title}</span></span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Platform + Tone */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* Platform */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">2 — Content Type</h2>
          <div className="space-y-2">
            {PLATFORMS.map(p => (
              <button key={p.value}
                onClick={() => setPlatform(p.value)}
                className={cn('w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all',
                  platform === p.value
                    ? 'border-[#C5FF00]/30 bg-[#C5FF00]/[0.05]'
                    : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]')}>
                <p.icon className={cn('w-4 h-4 shrink-0', platform === p.value ? 'text-[#C5FF00]' : 'text-white/25')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', platform === p.value ? 'text-white' : 'text-white/50')}>{p.label}</p>
                  <p className="text-[11px] text-white/25">{p.sub}</p>
                </div>
                {platform === p.value && <Check className="w-3.5 h-3.5 text-[#C5FF00] shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">3 — Tone</h2>
          <div className="space-y-2">
            {TONES.map(t => (
              <button key={t.value}
                onClick={() => setTone(t.value)}
                className={cn('w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all',
                  tone === t.value
                    ? 'border-[#C5FF00]/30 bg-[#C5FF00]/[0.05]'
                    : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]')}>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', tone === t.value ? 'text-white' : 'text-white/50')}>{t.label}</p>
                  <p className="text-[11px] text-white/25">{t.desc}</p>
                </div>
                {tone === t.value && <Check className="w-3.5 h-3.5 text-[#C5FF00] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Generate */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">4 — Generate</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => generate()}
            disabled={isStreaming || !selectedOpp}
            className="bg-[#C5FF00] hover:bg-[#C5FF00]/90 text-black font-bold h-10 px-6 text-sm">
            {isStreaming
              ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Generating…</>
              : <><Zap className="w-3.5 h-3.5 mr-2" />Generate</>}
          </Button>
          {isStreaming && (
            <Button variant="ghost" onClick={() => abortRef.current?.abort()}
              className="h-10 text-sm border border-white/[0.1] text-white/40 hover:text-white">Stop</Button>
          )}
        </div>
      </section>

      {/* 5. Output panel */}
      {(content || isStreaming) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/30">Output</h2>
            {content && !isStreaming && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost"
                  onClick={() => generate()}
                  className="h-8 text-xs border border-white/[0.08] text-white/35 hover:text-white gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </Button>
              </div>
            )}
          </div>

          {isStreaming && !content && (
            <div className="flex items-center gap-3 py-8 text-white/25 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating content…
            </div>
          )}

          {renderContent()}

          {/* Schedule + Save row */}
          {content && !isStreaming && (
            <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-3 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-3.5 h-3.5 text-white/20 shrink-0" />
                <label className="text-xs text-white/30 shrink-0">Schedule for</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-white/20 [color-scheme:dark]"
                />
                {scheduledFor && (
                  <button onClick={() => setScheduledFor('')}
                    className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <Button size="sm" variant="ghost"
                disabled={savingDraft}
                onClick={saveDraft}
                className="h-8 text-xs border border-white/[0.08] text-white/35 hover:text-white gap-1.5 shrink-0">
                {savingDraft
                  ? <><Loader2 className="w-3 h-3 animate-spin" />Saving…</>
                  : <><BookmarkPlus className="w-3 h-3" />Save Draft</>}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* 6. Drafts Library */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/30">Drafts Library</h2>
          <span className="text-xs text-white/20">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
        </div>

        {draftsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-white/20" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-8 text-center">
            <BarChart3 className="w-6 h-6 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/20">No drafts yet. Generate your first post above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.map(draft => (
              <div key={draft.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                {/* Draft header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white/70 truncate">
                        {draft.opportunities?.title ?? 'Unknown Opportunity'}
                      </span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-mono',
                        draft.status === 'posted'
                          ? 'border-emerald-400/25 text-emerald-400/70 bg-emerald-400/[0.06]'
                          : 'border-white/[0.08] text-white/25')}>
                        {draft.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-white/25">{PLATFORM_LABELS[draft.platform]}</span>
                      <span className="text-[11px] text-white/20">·</span>
                      <span className="text-[11px] text-white/25">{TONE_LABELS[draft.tone]}</span>
                      <span className="text-[11px] text-white/20">·</span>
                      <span className="text-[11px] text-white/20">{new Date(draft.created_at).toLocaleDateString()}</span>
                      {draft.scheduled_for && (
                        <>
                          <span className="text-[11px] text-white/20">·</span>
                          <span className="flex items-center gap-1 text-[11px] text-[#C5FF00]/60">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(draft.scheduled_for).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Inline schedule editor */}
                    {editingSchedule === draft.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="datetime-local"
                          defaultValue={draft.scheduled_for ? new Date(draft.scheduled_for).toISOString().slice(0, 16) : ''}
                          onChange={e => setEditScheduleVal(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="bg-white/[0.03] border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none focus:border-[#C5FF00]/30 [color-scheme:dark]"
                        />
                        <button onClick={() => saveSchedule(draft.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-[#C5FF00]/[0.08] border border-[#C5FF00]/20 text-[#C5FF00]/70 hover:bg-[#C5FF00]/[0.14] transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditingSchedule(null)}
                          className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CopyButton text={draft.content} />
                    {/* Schedule toggle */}
                    {draft.status === 'draft' && (
                      <button
                        onClick={() => { setEditingSchedule(editingSchedule === draft.id ? null : draft.id); setEditScheduleVal(draft.scheduled_for ?? ''); }}
                        title={draft.scheduled_for ? 'Edit schedule' : 'Set schedule'}
                        className={cn('p-1.5 rounded transition-colors',
                          draft.scheduled_for
                            ? 'text-[#C5FF00]/50 hover:text-[#C5FF00] hover:bg-[#C5FF00]/[0.06]'
                            : 'text-white/20 hover:text-white/50 hover:bg-white/[0.04]')}>
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {draft.status === 'draft' && (
                      <button onClick={() => markPosted(draft.id)}
                        title="Mark as posted"
                        className="p-1.5 rounded text-white/20 hover:text-emerald-400 hover:bg-emerald-400/[0.06] transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)}
                      className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors">
                      {expandedDraft === draft.id
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteDraft(draft.id)}
                      className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/[0.06] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded preview */}
                {expandedDraft === draft.id && (
                  <div className="border-t border-white/[0.05] px-4 py-3">
                    <p className="text-sm text-white/50 whitespace-pre-wrap leading-relaxed">
                      {draft.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8">
        {premiumAccess ? (
          <GeneratorContent />
        ) : (
          <div>
            {/* Show header + step 1 freely, gate the generator behind paywall */}
            <div className="mb-8 max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-1">
                <PenLine className="w-5 h-5 text-[#C5FF00]" />
                <h1 className="text-xl font-black tracking-tight text-white">Content Generator</h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C5FF00]/10 text-[#C5FF00]/70 font-mono border border-[#C5FF00]/15">AI</span>
              </div>
              <p className="text-sm text-white/35">Generate ready-to-post Twitter and LinkedIn content from live opportunity data.</p>
            </div>
            <PremiumSection
              isPremium={false}
              title="AI Content Generator"
              headline="Generate viral posts in seconds"
              benefits={[
                '7-tweet opportunity showcase threads',
                'LinkedIn long-form framework posts',
                'LinkedIn carousel captions',
                'Data-driven, founder story & hot-take tones',
                'Save and manage a drafts library',
              ]}
              onUpgrade={() => window.location.href = '/billing?plan=yearly'}
              accent="lime"
              preview={
                <div className="space-y-2 pointer-events-none">
                  {['🧵 This AI niche is worth $40M/year…', 'Only 3 companies are building here.', 'Here\'s the data + why you should pay attention 👇'].map((t, i) => (
                    <div key={i} className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white/50">{t}</div>
                  ))}
                </div>
              }
            >
              <div className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.05]" />
            </PremiumSection>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
