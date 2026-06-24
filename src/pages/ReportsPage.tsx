import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/db/supabase';
import type { Report } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Streamdown } from 'streamdown';
import {
  FileText, Search, Zap, ShieldCheck, Users,
  Code2, Rocket, Trash2, X, BookOpen, Bookmark,
  Download, FileDown, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ExportPaywallModal } from '@/components/paywall/ExportPaywallModal';

const REPORT_TYPES: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  research:   { label: 'Research',   icon: Zap,         color: 'text-primary bg-primary/10 border-primary/20' },
  validation: { label: 'Validation', icon: ShieldCheck, color: 'text-success bg-success/10 border-success/20' },
  competitor: { label: 'Competitor', icon: Users,        color: 'text-warning bg-warning/10 border-warning/20' },
  mvp:        { label: 'MVP Plan',   icon: Code2,        color: 'text-info bg-info/10 border-info/20' },
  launch:     { label: 'Launch',     icon: Rocket,       color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
};

const FOLDERS = ['All', 'Research', 'Validation', 'MVP Plan', 'Launch', 'Competitor'];

function ReportCard({
  report,
  onDelete,
  onView,
}: {
  report: Report;
  onDelete: (id: string) => void;
  onView: (report: Report) => void;
}) {
  const meta = REPORT_TYPES[report.type] ?? { label: report.type, icon: FileText, color: 'text-muted-foreground bg-muted/40 border-border/40' };
  const date = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hasContent = !!(report.content as Record<string, unknown>)?.text;

  return (
    <div className="glass rounded-xl p-5 border border-border/40 hover:border-primary/20 transition-all h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center shrink-0', meta.color)}>
          <meta.icon className="w-4 h-4" />
        </div>
        <Badge className={cn('text-[10px] shrink-0', meta.color)}>{meta.label}</Badge>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 text-balance flex-1">{report.title}</h3>
      <p className="text-xs text-muted-foreground mb-4 font-mono-num">{date}</p>
      <div className="flex items-center gap-2 mt-auto">
        <Badge className={cn('text-[10px]', report.status === 'completed' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border/30')}>
          {report.status}
        </Badge>
        <div className="flex-1" />
        {hasContent && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={() => onView(report)}
            title="View report"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => onDelete(report.id)}
          title="Delete report"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EmptyReports({ onAction }: { onAction: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-7 h-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">No reports yet</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto text-pretty">
        Generate your first AI-powered research report to see it here.
      </p>
      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" onClick={onAction}>
        <Zap className="w-3.5 h-3.5 mr-1.5" /> Start Researching
      </Button>
    </div>
  );
}

function EmptyWatchlist({ onAction }: { onAction: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
        <Bookmark className="w-7 h-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">Your watchlist is empty</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto text-pretty">
        Save opportunities from the dashboard to track them here.
      </p>
      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" onClick={onAction}>
        <Zap className="w-3.5 h-3.5 mr-1.5" /> Explore Opportunities
      </Button>
    </div>
  );
}

export default function ReportsPage() {
  const { user, premiumAccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [watchlist, setWatchlist] = useState<Array<{ id: string; item_id: string; created_at: string; opportunity?: { title: string; category: string; opportunity_score: number | null; is_hidden_gem: boolean } | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('All');
  const [activeTab, setActiveTab] = useState<'reports' | 'watchlist' | 'blueprints'>(() => {
    const t = searchParams.get('tab');
    if (t === 'watchlist' || t === 'blueprints') return t;
    return 'reports';
  });

  // Keep tab in sync with URL query param changes (e.g. sidebar links)
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'watchlist' || t === 'blueprints') setActiveTab(t);
    else setActiveTab('reports');
  }, [searchParams]);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [exportPaywallOpen, setExportPaywallOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    // Load reports
    supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setReports(Array.isArray(data) ? data : []); setLoading(false); });

    // Load watchlist with opportunity details
    supabase
      .from('saved_items')
      .select('id, item_id, created_at, opportunities:item_id(title, category, opportunity_score, is_hidden_gem)')
      .eq('user_id', user.id)
      .eq('item_type', 'opportunity')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = (Array.isArray(data) ? data : []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          item_id: row.item_id as string,
          created_at: row.created_at as string,
          opportunity: Array.isArray(row.opportunities)
            ? (row.opportunities[0] as { title: string; category: string; opportunity_score: number | null; is_hidden_gem: boolean } | undefined) ?? null
            : (row.opportunities as { title: string; category: string; opportunity_score: number | null; is_hidden_gem: boolean } | null) ?? null,
        }));
        setWatchlist(items);
        setWatchlistLoading(false);
      });
  }, [user, navigate]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) { toast.error('Failed to delete report'); return; }
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success('Report deleted');
  };

  const handleRemoveWatchlist = async (id: string) => {
    const { error } = await supabase.from('saved_items').delete().eq('id', id);
    if (error) { toast.error('Failed to remove from watchlist'); return; }
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
    toast.success('Removed from watchlist');
  };

  const filtered = reports.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const folderType = folder === 'All' ? true
      : folder === 'MVP Plan' ? r.type === 'mvp'
      : r.type === folder.toLowerCase();
    return matchSearch && folderType;
  });

  const typeCounts = reports.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reportText = viewingReport
    ? ((viewingReport.content as Record<string, unknown>)?.text as string) ?? ''
    : '';

  function exportReportsCSV() {
    if (!premiumAccess) { setExportPaywallOpen(true); return; }
    const headers = ['Title', 'Type', 'Status', 'Created At'];
    const rows = reports.map((r) => [
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.type,
      r.status,
      new Date(r.created_at).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kraitin-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reports exported as CSV');
  }

  function downloadReportMarkdown(report: Report) {
    const raw = report.content;
    const content = typeof raw === 'string'
      ? raw
      : (raw as Record<string, unknown>)?.markdown as string
        ?? (raw as Record<string, unknown>)?.text as string
        ?? JSON.stringify(raw, null, 2)
        ?? report.title
        ?? 'No content';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown downloaded');
  }

  async function exportReportViaEdge(report: Report, format: 'html' | 'rtf') {
    if (!premiumAccess) { setExportPaywallOpen(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Not authenticated'); return; }
    const label = format === 'html' ? 'HTML' : 'Word (RTF)';
    const toastId = toast.loading(`Generating ${label} export…`);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reportId: report.id, format }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${format === 'html' ? 'html' : 'rtf'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${label} export downloaded`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed', { id: toastId });
    }
  }

  return (
    <AppLayout>
      <ErrorBoundary>
        <ExportPaywallModal open={exportPaywallOpen} onClose={() => setExportPaywallOpen(false)} />
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">Reports</h1>
              <p className="text-muted-foreground mt-1 text-sm">All your generated research, validation, MVP, and launch reports.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9 text-xs border-border/40 hover:bg-muted/40" onClick={exportReportsCSV}>
                <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" onClick={() => navigate('/research')}>
                <Zap className="w-3.5 h-3.5 mr-1.5" /> New Report
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit border border-border/30">
            {([
              { key: 'reports',    label: 'Reports' },
              { key: 'watchlist',  label: watchlist.length > 0 ? `Watchlist (${watchlist.length})` : 'Watchlist' },
              { key: 'blueprints', label: 'Blueprints' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === key
                    ? 'bg-background text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(REPORT_TYPES).map(([type, meta]) => (
                  <div key={type} className="glass rounded-xl p-4 border border-border/40 flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center shrink-0', meta.color)}>
                      <meta.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                      <p className="text-lg font-bold font-mono-num text-foreground">{typeCounts[type] || 0}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…"
                    className="pl-9 bg-muted/30 border-border/50 h-10" />
                </div>
                <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
                  {FOLDERS.map((f) => (
                    <button key={f} onClick={() => setFolder(f)}
                      className={cn('px-3 py-1.5 rounded-lg text-sm border transition-all shrink-0',
                        folder === f ? 'bg-primary/10 border-primary/20 text-primary' : 'glass border-border/40 text-muted-foreground hover:text-foreground')}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 bg-muted rounded-xl" />)}
                </div>
              ) : filtered.length === 0 && reports.length === 0 ? (
                <EmptyReports onAction={() => navigate('/research')} />
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-sm">No reports match your search.</p>
                  <button onClick={() => { setSearch(''); setFolder('All'); }} className="text-primary text-sm mt-2 hover:underline">
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((r) => (
                    <ReportCard key={r.id} report={r} onDelete={handleDelete} onView={setViewingReport} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <>
              {watchlistLoading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 bg-muted rounded-xl" />)}
                </div>
              ) : watchlist.length === 0 ? (
                <EmptyWatchlist onAction={() => navigate('/dashboard')} />
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {watchlist.map((item) => {
                    const opp = item.opportunity;
                    const score = opp?.opportunity_score ?? null;
                    const scoreColor = score !== null
                      ? score >= 80 ? 'text-[#C5FF00]' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                      : 'text-white/25';
                    return (
                      <div
                        key={item.id}
                        className="glass rounded-xl p-4 border border-border/40 hover:border-white/15 transition-all flex flex-col gap-3 cursor-pointer"
                        onClick={() => opp && navigate(`/opportunity/${item.item_id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {opp?.category && (
                              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{opp.category}</p>
                            )}
                            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                              {opp?.title ?? `Opportunity ${item.item_id.slice(0, 8)}…`}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-white/20 hover:text-red-400 hover:bg-red-400/10"
                            onClick={(e) => { e.stopPropagation(); handleRemoveWatchlist(item.id); }}
                            title="Remove from watchlist"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                          <p className="text-[11px] text-white/25">
                            Saved {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          {score !== null && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-white/20">Score</span>
                              <span className={`text-sm font-bold font-mono ${scoreColor}`}>{score}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Blueprints Tab — MVP + Launch plans */}
          {activeTab === 'blueprints' && (() => {
            const blueprints = reports.filter((r) => r.type === 'mvp' || r.type === 'launch');
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-white/30" />
                  <p className="text-xs text-white/30">
                    Saved MVP plans and launch strategies generated by the AI agents.
                  </p>
                </div>
                {loading ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 bg-muted rounded-xl" />)}
                  </div>
                ) : blueprints.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Layers className="w-8 h-8 text-white/10 mx-auto" />
                    <p className="text-white/25 text-sm">No blueprints yet.</p>
                    <p className="text-white/15 text-xs">Generate an MVP or Launch plan using the AI agents.</p>
                    <div className="flex gap-2 justify-center pt-1">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-white/[0.08] text-white/40 hover:text-white/70" onClick={() => navigate('/mvp-planner')}>
                        <Code2 className="w-3.5 h-3.5 mr-1.5" /> MVP Planner
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-white/[0.08] text-white/40 hover:text-white/70" onClick={() => navigate('/launch-agent')}>
                        <Rocket className="w-3.5 h-3.5 mr-1.5" /> Launch Agent
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {blueprints.map((r) => (
                      <ReportCard key={r.id} report={r} onDelete={handleDelete} onView={setViewingReport} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Report Viewer Modal */}
        <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90dvh] overflow-y-auto bg-background border-border/40">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base text-balance pr-8">
                {viewingReport && (() => {
                  const meta = REPORT_TYPES[viewingReport.type] ?? { icon: FileText, color: 'text-muted-foreground' };
                  const Icon = meta.icon;
                  return <><Icon className={cn('w-4 h-4 shrink-0', meta.color.split(' ')[0])} />{viewingReport.title}</>;
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="prose prose-invert prose-sm max-w-none mt-2">
              {reportText ? (
                <Streamdown>{reportText}</Streamdown>
              ) : (
                <p className="text-muted-foreground text-sm">Report content not available. Please regenerate this report.</p>
              )}
            </div>
            {viewingReport && reportText && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/30 mt-4">
                <Button variant="outline" size="sm" className="text-xs border-border/40 hover:bg-muted/40"
                  onClick={() => downloadReportMarkdown(viewingReport)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Markdown
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border/40 hover:bg-muted/40"
                  onClick={() => exportReportViaEdge(viewingReport, 'html')}>
                  <FileDown className="w-3.5 h-3.5 mr-1.5" /> HTML (PDF-ready)
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border/40 hover:bg-muted/40"
                  onClick={() => exportReportViaEdge(viewingReport, 'rtf')}>
                  <FileDown className="w-3.5 h-3.5 mr-1.5" /> Word (RTF)
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    </AppLayout>
  );
}

