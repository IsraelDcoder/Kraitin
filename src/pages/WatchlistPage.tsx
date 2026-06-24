import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import { slugify } from '@/lib/slugify';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Bookmark, X, ArrowRight, TrendingUp, Gem, Zap } from 'lucide-react';

interface SavedOpportunity {
  id: string;
  item_id: string;
  created_at: string;
  opportunity: {
    title: string;
    category: string;
    opportunity_score: number | null;
    is_hidden_gem: boolean;
    revenue_estimate: string | null;
    growth_velocity: string | null;
  } | null;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 80 ? 'text-[#C5FF00]' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-1">
      <Zap className={`w-3 h-3 ${color}`} />
      <span className={`text-sm font-bold font-mono ${color}`}>{score}</span>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
        <Bookmark className="w-6 h-6 text-white/20" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-white/60">No saved opportunities yet</p>
        <p className="text-xs text-white/25 max-w-xs">
          Browse opportunities and tap the bookmark icon to save them here for later.
        </p>
      </div>
      <button
        onClick={() => navigate('/opportunities')}
        className="mt-2 flex items-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold bg-white/[0.05] text-white/60 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80 transition-all"
      >
        Browse Opportunities <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    // 2-step query: saved_items first, then fetch opportunities by ids
    supabase
      .from('saved_items')
      .select('id, item_id, created_at')
      .eq('user_id', user.id)
      .eq('item_type', 'opportunity')
      .order('created_at', { ascending: false })
      .then(async ({ data: saved, error }) => {
        if (error) { toast.error('Failed to load watchlist'); setLoading(false); return; }
        if (!saved?.length) { setItems([]); setLoading(false); return; }

        const ids = saved.map((s) => s.item_id);
        const { data: opps, error: oppsErr } = await supabase
          .from('opportunities')
          .select('id, title, category, opportunity_score, is_hidden_gem, revenue_estimate, growth_velocity')
          .in('id', ids);

        if (oppsErr) { toast.error('Failed to load opportunity details'); setLoading(false); return; }

        const oppMap = Object.fromEntries((opps ?? []).map((o) => [o.id, o]));
        setItems(saved.map((s) => ({
          id: s.id,
          item_id: s.item_id,
          created_at: s.created_at,
          opportunity: oppMap[s.item_id] ?? null,
        })));
        setLoading(false);
      });
  }, [user, navigate]);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from('saved_items').delete().eq('id', id);
    if (error) { toast.error('Failed to remove'); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Removed from watchlist');
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Bookmark className="w-3.5 h-3.5 text-white/50" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Watchlist</h1>
              {!loading && items.length > 0 && (
                <p className="text-xs text-white/25 mt-0.5">{items.length} saved {items.length === 1 ? 'opportunity' : 'opportunities'}</p>
              )}
            </div>
          </div>
          {!loading && items.length > 0 && (
            <button
              onClick={() => navigate('/opportunities')}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Browse more <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-white/[0.03] rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => {
              const opp = item.opportunity;
              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer p-4 flex flex-col gap-3"
                  onClick={() => opp?.title
                    ? navigate(`/opportunity/${slugify(opp.title)}`, { state: { opp } })
                    : undefined
                  }
                >
                  {/* Remove button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 right-3 h-6 w-6 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                    title="Remove from watchlist"
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {/* Title & category */}
                  <div className="pr-6">
                    {opp?.category && (
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{opp.category}</p>
                    )}
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2 text-balance">
                      {opp?.title ?? `Opportunity ${item.item_id.slice(0, 8)}…`}
                    </p>
                  </div>

                  {/* Gems badge */}
                  {opp?.is_hidden_gem && (
                    <div className="flex items-center gap-1">
                      <Gem className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] text-violet-400 font-medium">Hidden Gem</span>
                    </div>
                  )}

                  {/* Footer: score + metadata */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-auto">
                    <p className="text-[10px] text-white/20">
                      Saved {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3">
                      {opp?.growth_velocity && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-white/20" />
                          <span className="text-[10px] text-white/30 font-mono">{opp.growth_velocity}</span>
                        </div>
                      )}
                      <ScoreBadge score={opp?.opportunity_score ?? null} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
