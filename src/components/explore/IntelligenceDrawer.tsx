import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Opportunity } from '@/types/types';
import {
  X, TrendingUp, Star, Zap, ShieldCheck, Code2, Rocket,
  BookmarkPlus, BookmarkCheck, ExternalLink, ChevronRight,
  Users, DollarSign, BarChart3, Target, Lightbulb, Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreRing, MeterBar, CompetitionLabel } from './ScoreBadge';

/* ── Derived data helpers ──────────────────────────────────── */
function getDifficultyFromScore(score: number): { label: string; color: string; value: number } {
  if (score <= 35) return { label: 'Easy', color: '#C5FF00', value: 30 };
  if (score <= 55) return { label: 'Medium', color: '#fbbf24', value: 55 };
  return { label: 'Hard', color: '#f87171', value: 80 };
}

function getTargetUsers(opp: Opportunity): string[] {
  const tags = opp.tags || [];
  if (tags.includes('B2B') || tags.includes('SaaS')) return ['SaaS founders', 'Enterprise teams', 'Operators'];
  if (tags.includes('health') || tags.includes('fitness')) return ['Health-conscious consumers', 'Fitness enthusiasts', 'Patients'];
  if (tags.includes('education') || tags.includes('students')) return ['Students', 'Educators', 'Working professionals'];
  if (tags.includes('finance') || tags.includes('fintech')) return ['SMB owners', 'Freelancers', 'Investors'];
  if (tags.includes('developer')) return ['Developers', 'DevOps engineers', 'CTOs'];
  if (tags.includes('creator') || tags.includes('content')) return ['Content creators', 'Influencers', 'Marketers'];
  return ['Early adopters', 'Tech-savvy consumers', 'Entrepreneurs'];
}

function getPainPoints(opp: Opportunity): string[] {
  const cat = opp.category.toLowerCase();
  if (cat === 'ai') return ['Manual workflows waste hours daily', 'Existing tools lack AI intelligence', 'Context switching kills productivity'];
  if (cat === 'health') return ['Generic advice doesn\'t work', 'Tracking is tedious', 'Access to experts is expensive'];
  if (cat === 'education') return ['One-size-fits-all learning fails', 'Lack of personalized feedback', 'High cost of tutoring'];
  if (cat === 'finance') return ['Fragmented financial data', 'Complex tax and compliance', 'Poor cash flow visibility'];
  if (cat === 'b2b saas') return ['Manual processes waste resources', 'Data silos between teams', 'Expensive enterprise solutions'];
  if (cat === 'productivity') return ['Too many tools, too little focus', 'No visibility into deep work time', 'Meetings eat the day'];
  return ['Existing solutions are too generic', 'High friction onboarding', 'Poor mobile experience'];
}

function getGrowthChannels(opp: Opportunity): string[] {
  const tags = opp.tags || [];
  const channels = [];
  if (tags.includes('B2B') || tags.includes('SaaS')) channels.push('Product-led growth', 'LinkedIn outreach', 'G2 & Capterra');
  else channels.push('App Store SEO', 'TikTok & Reels', 'Influencer marketing');
  channels.push('SEO content marketing', 'Community building');
  if (tags.includes('AI')) channels.push('AI directory listings');
  return channels.slice(0, 4);
}

function getPricingRange(opp: Opportunity): string {
  const rev = opp.revenue_estimate || '';
  if (rev.includes('$15k') || rev.includes('$20k') || rev.includes('$12k')) return '$49–$299/mo';
  if (rev.includes('$8k') || rev.includes('$10k')) return '$29–$149/mo';
  if (rev.includes('$3k') || rev.includes('$4k') || rev.includes('$5k')) return '$9–$49/mo';
  return '$19–$99/mo';
}

function getSampleCompetitors(opp: Opportunity): string[] {
  const cat = opp.category.toLowerCase();
  if (cat === 'ai') return ['ChatGPT', 'Claude', 'Jasper', 'Copy.ai'];
  if (cat === 'health') return ['Noom', 'MyFitnessPal', 'Headspace', 'Calm'];
  if (cat === 'education') return ['Duolingo', 'Coursera', 'Khan Academy'];
  if (cat === 'finance') return ['QuickBooks', 'Mint', 'Wave', 'Brex'];
  if (cat === 'b2b saas') return ['HubSpot', 'Salesforce', 'Notion', 'Monday.com'];
  if (cat === 'productivity') return ['Notion', 'Todoist', 'Linear', 'Asana'];
  if (cat === 'consumer') return ['Pinterest', 'Instagram', 'TikTok'];
  return ['Market leaders', 'Niche alternatives', 'Incumbents'];
}

/* ── Drawer component ──────────────────────────────────────── */
interface IntelligenceDrawerProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export function IntelligenceDrawer({ opportunity: opp, onClose }: IntelligenceDrawerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  // check if already saved
  useEffect(() => {
    if (!opp || !user) return;
    setSaved(false);
    supabase.from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'opportunity')
      .eq('item_id', opp.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setSaved(true); });
  }, [opp, user]);

  const handleSave = async () => {
    if (!opp || !user) return;
    setSavingLoading(true);
    if (saved) {
      await supabase.from('saved_items').delete()
        .eq('user_id', user.id).eq('item_type', 'opportunity').eq('item_id', opp.id);
      setSaved(false);
      toast.success('Removed from saved');
    } else {
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'opportunity', item_id: opp.id });
      setSaved(true);
      toast.success('Saved to workspace!');
    }
    setSavingLoading(false);
  };

  const handleAction = (path: string) => {
    if (!opp) return;
    navigate(`${path}?idea=${encodeURIComponent(opp.title)}`);
    onClose();
  };

  const visible = !!opp;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-40 transition-opacity duration-300',
          visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'fixed top-0 right-0 h-full z-50 flex flex-col',
        'w-full md:w-[540px] bg-[#0A0A0A] border-l border-white/[0.07]',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-x-0' : 'translate-x-full'
      )}>
        {!opp ? null : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-white/[0.06] shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-[10px] bg-white/[0.04] text-white/40 border-white/[0.08]">{opp.category}</Badge>
                  {opp.is_hidden_gem && (
                    <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">
                      <Star className="w-2.5 h-2.5 mr-1" /> Hidden Gem
                    </Badge>
                  )}
                </div>
                <h2 className="text-lg font-black text-white text-balance leading-tight">{opp.title}</h2>
                {opp.description && (
                  <p className="text-white/40 text-xs mt-2 leading-relaxed text-pretty">{opp.description}</p>
                )}
              </div>
              <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Score + key metrics row */}
              <div className="flex items-center gap-5 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                <ScoreRing score={opp.opportunity_score ?? 0} size={80} />
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Revenue Est.', value: opp.revenue_estimate || '—', icon: DollarSign },
                    { label: 'Downloads', value: opp.downloads || '—', icon: Users },
                    { label: 'Growth', value: opp.growth_percent ? `+${opp.growth_percent}%` : '—', icon: TrendingUp },
                    { label: 'Market Size', value: opp.market_size || '—', icon: BarChart3 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Icon className="w-2.5 h-2.5 text-white/25" />
                        <span className="text-[10px] text-white/30">{label}</span>
                      </div>
                      <span className="text-xs font-semibold text-white/80">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score meters */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Scoring Breakdown</p>
                {[
                  { label: 'Opportunity Score', value: opp.opportunity_score ?? 0, color: '#C5FF00' },
                  { label: 'Market Demand', value: Math.min(100, (opp.opportunity_score ?? 0) + 5), color: '#34d399' },
                  { label: 'Growth Signal', value: Math.min(100, (opp.growth_percent ?? 0) * 1.1), color: '#38bdf8' },
                  { label: 'Competition', value: opp.competition_score ?? 0, color: '#f87171' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-32 shrink-0">{label}</span>
                    <MeterBar value={value} color={color} />
                    <span className="text-xs font-mono text-white/50 w-8 text-right shrink-0">{Math.round(value)}</span>
                  </div>
                ))}
                {/* Difficulty */}
                {(() => {
                  const diff = getDifficultyFromScore(opp.competition_score ?? 50);
                  return (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40 w-32 shrink-0">Launch Difficulty</span>
                      <MeterBar value={diff.value} color={diff.color} />
                      <span className="text-xs font-semibold w-8 text-right shrink-0" style={{ color: diff.color }}>{diff.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Competition + Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <p className="text-[10px] text-white/25 mb-1">Competition</p>
                  <CompetitionLabel score={opp.competition_score ?? 50} />
                </div>
                <div className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <p className="text-[10px] text-white/25 mb-1">Recommended Pricing</p>
                  <span className="text-xs font-semibold text-white/80">{getPricingRange(opp)}</span>
                </div>
              </div>

              {/* Target users */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Target Users</p>
                <div className="flex flex-wrap gap-1.5">
                  {getTargetUsers(opp).map((u) => (
                    <span key={u} className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50">{u}</span>
                  ))}
                </div>
              </div>

              {/* Pain points */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Pain Points</p>
                <div className="space-y-1.5">
                  {getPainPoints(opp).map((p) => (
                    <div key={p} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#C5FF00]/60 mt-1.5 shrink-0" />
                      <span className="text-xs text-white/50">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth channels */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Top Growth Channels</p>
                <div className="space-y-1.5">
                  {getGrowthChannels(opp).map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-[#C5FF00]/50 shrink-0" />
                      <span className="text-xs text-white/50">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitors */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Known Competitors</p>
                <div className="flex flex-wrap gap-1.5">
                  {getSampleCompetitors(opp).map((c) => (
                    <div key={c} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/40">
                      <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {opp.tags?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-[#C5FF00]/15 bg-[#C5FF00]/5 text-[#C5FF00]/60">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="shrink-0 px-6 pb-6 pt-4 border-t border-white/[0.06] space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('/research')}
                  className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#C5FF00] text-black text-xs font-bold hover:bg-[#C5FF00]/90 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" /> Research
                </button>
                <button
                  onClick={() => handleAction('/validation')}
                  className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-white/[0.1] text-white/70 text-xs font-medium hover:bg-white/[0.05] hover:text-white transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Validate
                </button>
                <button
                  onClick={() => handleAction('/mvp-planner')}
                  className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-white/[0.1] text-white/70 text-xs font-medium hover:bg-white/[0.05] hover:text-white transition-all"
                >
                  <Code2 className="w-3.5 h-3.5" /> MVP Plan
                </button>
                <button
                  onClick={() => handleAction('/launch-agent')}
                  className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-white/[0.1] text-white/70 text-xs font-medium hover:bg-white/[0.05] hover:text-white transition-all"
                >
                  <Rocket className="w-3.5 h-3.5" /> Launch Plan
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={savingLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-all',
                  saved
                    ? 'bg-[#C5FF00]/10 text-[#C5FF00] border border-[#C5FF00]/20 hover:bg-[#C5FF00]/15'
                    : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
                )}
              >
                {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                {saved ? 'Saved to Workspace' : 'Save Opportunity'}
              </button>
              <p className="text-center text-[10px] text-white/20 flex items-center justify-center gap-1">
                <Lightbulb className="w-2.5 h-2.5" /> AI generates report in ~30 seconds
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* tiny re-export for trending */
export { Flame };
