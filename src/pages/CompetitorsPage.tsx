import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PaywallModal } from '@/components/common/PaywallModal';
import { supabase } from '@/db/supabase';
import { sendAiSearchRequest } from '@/lib/sse';
import type { Competitor } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RecentTasks } from '@/components/intelligence/RecentTasks';
import {
  Users, Search, ExternalLink, RefreshCw, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface AdCreative { hook: string; angle: string; channel: string; ctr: string; }
interface Influencer  { name: string; niche: string; followers: string; est_cost: string; platform: string; }

function parseAdCreatives(raw: string): AdCreative[] {
  const results: AdCreative[] = [];
  // Match JSON array if model wraps it
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) as AdCreative[]; } catch { /* fall through */ }
  }
  // Line-based parse: "hook | angle | channel | ctr"
  for (const line of raw.split('\n')) {
    const parts = line.replace(/^[-*•\d.]+\s*/, '').split('|').map(s => s.trim());
    if (parts.length >= 4 && parts[0]) {
      results.push({ hook: parts[0].replace(/^["']|["']$/g, ''), angle: parts[1], channel: parts[2], ctr: parts[3] });
    }
  }
  return results.slice(0, 6);
}

function parseInfluencers(raw: string): Influencer[] {
  const results: Influencer[] = [];
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) as Influencer[]; } catch { /* fall through */ }
  }
  for (const line of raw.split('\n')) {
    const parts = line.replace(/^[-*•\d.]+\s*/, '').split('|').map(s => s.trim());
    if (parts.length >= 5 && parts[0]) {
      results.push({ name: parts[0], niche: parts[1], platform: parts[2], followers: parts[3], est_cost: parts[4] });
    }
  }
  return results.slice(0, 8);
}

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const isPos = value >= 0;
  return (
    <span className={cn('text-xs font-mono-num font-semibold', isPos ? 'text-success' : 'text-danger')}>
      {isPos ? '+' : ''}{value}%
    </span>
  );
}

function CompetitorRow({ comp }: { comp: Competitor }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/3 transition-colors border-b border-border/20 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 text-xs font-bold text-foreground uppercase">
        {comp.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground truncate">{comp.name}</p>
          {comp.category && <Badge className="text-[10px] bg-muted text-muted-foreground border-border/30">{comp.category}</Badge>}
        </div>
        {comp.pricing && <p className="text-xs text-muted-foreground">{comp.pricing}</p>}
      </div>
      <div className="hidden md:grid grid-cols-4 gap-4 text-right">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Revenue</p>
          <p className="text-xs font-mono-num text-foreground">{comp.revenue_estimate || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Traffic</p>
          <p className="text-xs font-mono-num text-foreground">{comp.monthly_traffic || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Growth</p>
          <GrowthBadge value={comp.growth_percent} />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">SEO</p>
          <p className="text-xs font-mono-num text-foreground">{comp.seo_score ?? '—'}</p>
        </div>
      </div>
      {comp.website_url && (
        <a href={comp.website_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

export default function CompetitorsPage() {
  const { user, premiumAccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  // AI-generated state
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [creativesLoading, setCreativesLoading] = useState(false);
  const [influencersLoading, setInfluencersLoading] = useState(false);
  const abortCreatives = useRef<AbortController | null>(null);
  const abortInfluencers = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('competitors').select('*').order('growth_percent', { ascending: false })
      .then(({ data }) => { setCompetitors(Array.isArray(data) ? data : []); setLoading(false); });
  }, [user, navigate]);

  const fetchAdCreatives = async (comps: Competitor[]) => {
    if (comps.length === 0) return;
    abortCreatives.current?.abort();
    abortCreatives.current = new AbortController();
    setCreativesLoading(true);
    setAdCreatives([]);
    const { data: { session } } = await supabase.auth.getSession();
    const names = comps.slice(0, 6).map(c => `${c.name} (${c.category || 'SaaS'})`).join(', ');
    const prompt = `You are a growth marketing expert. Based on these competitor companies: ${names}

Generate 6 high-performing ad creative hooks that would work for a competing product in this space.
Return ONLY a JSON array (no extra text) in this exact format:
[
  {"hook": "ad hook text here", "angle": "Transformation|Pain Point|Social Proof|FOMO|Risk Removal|Success Story", "channel": "TikTok|Instagram|YouTube|LinkedIn|Google Ads", "ctr": "X.X%"},
  ...
]
Make the hooks specific to this niche, compelling, and based on real marketing patterns.`;

    let raw = '';
    await sendAiSearchRequest({
      functionUrl: `${supabaseUrl}/functions/v1/ai-search`,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      supabaseAnonKey,
      accessToken: session?.access_token,
      onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (chunk) raw += chunk;
        } catch { /* incomplete */ }
      },
      onComplete: () => {
        const items = parseAdCreatives(raw);
        setAdCreatives(items.length > 0 ? items : []);
        setCreativesLoading(false);
      },
      onError: () => {
        toast.error('Failed to generate ad creatives');
        setCreativesLoading(false);
      },
      signal: abortCreatives.current.signal,
    });
  };

  const fetchInfluencers = async (comps: Competitor[]) => {
    if (comps.length === 0) return;
    abortInfluencers.current?.abort();
    abortInfluencers.current = new AbortController();
    setInfluencersLoading(true);
    setInfluencers([]);
    const { data: { session } } = await supabase.auth.getSession();
    const categories = [...new Set(comps.map(c => c.category).filter(Boolean))].join(', ');
    const prompt = `You are an influencer marketing expert. For a startup competing in these niches: ${categories || 'SaaS / Tech'}

List 8 real or representative influencer profiles who would be ideal for sponsorships in this space.
Return ONLY a JSON array (no extra text) in this exact format:
[
  {"name": "@handle", "niche": "niche description", "platform": "TikTok|YouTube|Instagram|LinkedIn|X", "followers": "XXXk or X.XM", "est_cost": "$Xk–$Xk"},
  ...
]
Use realistic handles, follower counts, and cost ranges based on actual influencer market rates.`;

    let raw = '';
    await sendAiSearchRequest({
      functionUrl: `${supabaseUrl}/functions/v1/ai-search`,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      supabaseAnonKey,
      accessToken: session?.access_token,
      onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (chunk) raw += chunk;
        } catch { /* incomplete */ }
      },
      onComplete: () => {
        const items = parseInfluencers(raw);
        setInfluencers(items.length > 0 ? items : []);
        setInfluencersLoading(false);
      },
      onError: () => {
        toast.error('Failed to generate influencer suggestions');
        setInfluencersLoading(false);
      },
      signal: abortInfluencers.current.signal,
    });
  };

  if (user && !premiumAccess) {
    return (
      <AppLayout>
        <PaywallModal feature="Competitor Intelligence" onClose={() => navigate('/billing')} />
      </AppLayout>
    );
  }

  const filtered = competitors.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-warning/15 border border-warning/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-warning" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Competitor Intelligence</h1>
          </div>
          <p className="text-muted-foreground text-sm">Reverse-engineer how competitors grow — revenue, traffic, marketing, and ad creatives.</p>
        </div>

        <Tabs defaultValue="overview" onValueChange={(v) => {
          if (!loading && competitors.length > 0) {
            if (v === 'creatives' && adCreatives.length === 0 && !creativesLoading) fetchAdCreatives(competitors);
            if (v === 'influencers' && influencers.length === 0 && !influencersLoading) fetchInfluencers(competitors);
          }
        }}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="creatives">Ad Creatives</TabsTrigger>
            <TabsTrigger value="influencers">Influencers</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search competitors…"
                className="pl-9 bg-muted/30 border-border/50 h-10 max-w-sm" />
            </div>
            <div className="glass rounded-xl border border-border/40 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_auto] gap-0 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <span className="text-xs text-muted-foreground">Company</span>
                <div className="grid grid-cols-4 gap-4 text-right">
                  {['Revenue', 'Traffic', 'Growth', 'SEO'].map(h => (
                    <span key={h} className="text-xs text-muted-foreground">{h}</span>
                  ))}
                </div>
              </div>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 bg-muted m-3 rounded-lg" />)
                : filtered.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-12">No competitors found.</p>
                  : filtered.map((c) => <CompetitorRow key={c.id} comp={c} />)
              }
            </div>
            <RecentTasks reportType="competitor" userId={user?.id} label="Recent Competitor Reports" />
          </TabsContent>

          {/* Marketing Breakdown */}
          <TabsContent value="marketing" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 bg-muted rounded-xl" />)
                : filtered.slice(0, 6).map((c) => (
                  <div key={c.id} className="glass rounded-xl p-5 border border-border/40">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-bold text-foreground">{c.name[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.category}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'TikTok', value: c.tiktok_followers, icon: '🎵' },
                        { label: 'YouTube', value: c.youtube_subs, icon: '▶️' },
                        { label: 'Instagram', value: c.instagram_followers, icon: '📸' },
                        { label: 'Ad Spend', value: c.ad_spend_estimate, icon: '💰' },
                      ].map((ch) => (
                        <div key={ch.label} className="bg-muted/30 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{ch.icon} {ch.label}</p>
                          <p className="text-xs font-mono-num font-semibold text-foreground">{ch.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          </TabsContent>

          {/* Ad Creatives — AI generated */}
          <TabsContent value="creatives" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">AI-generated high-performing ad hooks based on competitors in this space.</p>
              {!creativesLoading && adCreatives.length > 0 && (
                <Button size="sm" variant="ghost" className="border border-border/40 text-muted-foreground hover:text-foreground h-8 text-xs"
                  onClick={() => fetchAdCreatives(competitors)}>
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerate
                </Button>
              )}
            </div>
            {creativesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analysing competitor creatives…</p>
              </div>
            ) : adCreatives.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm mb-4">Click to generate AI-powered ad creative suggestions based on your competitors.</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm"
                  onClick={() => fetchAdCreatives(competitors)} disabled={loading || competitors.length === 0}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Generate Ad Creatives
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {adCreatives.map((ad, i) => (
                  <div key={i} className="glass rounded-xl p-5 border border-border/40 hover:border-primary/20 transition-all h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{ad.channel}</Badge>
                      <span className="text-xs font-mono-num text-success">{ad.ctr} CTR</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-3 flex-1 text-balance">"{ad.hook}"</p>
                    <Badge className="text-[10px] self-start bg-muted text-muted-foreground border-border/30">{ad.angle}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Influencers — AI generated */}
          <TabsContent value="influencers" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">AI-suggested influencers relevant to your competitive space.</p>
              {!influencersLoading && influencers.length > 0 && (
                <Button size="sm" variant="ghost" className="border border-border/40 text-muted-foreground hover:text-foreground h-8 text-xs"
                  onClick={() => fetchInfluencers(competitors)}>
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerate
                </Button>
              )}
            </div>
            {influencersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Finding relevant influencers…</p>
              </div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm mb-4">Click to get AI-powered influencer suggestions matched to this niche.</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm"
                  onClick={() => fetchInfluencers(competitors)} disabled={loading || competitors.length === 0}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Find Influencers
                </Button>
              </div>
            ) : (
              <div className="glass rounded-xl border border-border/40 overflow-x-auto">
                <div className="grid grid-cols-5 px-4 py-2.5 border-b border-border/30 bg-muted/20 text-xs text-muted-foreground min-w-[560px] whitespace-nowrap">
                  <span>Creator</span><span>Niche</span><span>Platform</span><span>Followers</span><span>Est. Cost</span>
                </div>
                {influencers.map((inf, i) => (
                  <div key={i} className={cn('grid grid-cols-5 px-4 py-3 items-center hover:bg-white/3 transition-colors min-w-[560px]', i < influencers.length - 1 && 'border-b border-border/20')}>
                    <p className="text-sm font-semibold text-primary truncate">{inf.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{inf.niche}</p>
                    <Badge className="text-[10px] w-fit bg-muted text-muted-foreground border-border/30">{inf.platform}</Badge>
                    <p className="text-xs font-mono-num text-foreground">{inf.followers}</p>
                    <p className="text-xs font-mono-num text-warning">{inf.est_cost}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
