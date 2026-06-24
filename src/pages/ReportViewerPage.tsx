import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard';
import type { IntelligenceData } from '@/components/intelligence/types';
import { extractIntelligenceJSON } from '@/components/intelligence/prompts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Zap, ShieldCheck, Code2, Rocket, Users, FileText, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/types/types';

const TYPE_META: Record<string, { label: string; icon: typeof FileText; color: string; accentColor: string }> = {
  research:   { label: 'Research',    icon: Zap,         color: 'text-[#C5FF00]',   accentColor: 'bg-[#C5FF00]/10 border-[#C5FF00]/20' },
  validation: { label: 'Validation',  icon: ShieldCheck, color: 'text-emerald-400', accentColor: 'bg-emerald-400/10 border-emerald-400/20' },
  mvp:        { label: 'MVP Plan',    icon: Code2,       color: 'text-violet-400',  accentColor: 'bg-violet-400/10 border-violet-400/20' },
  launch:     { label: 'Launch',      icon: Rocket,      color: 'text-orange-400',  accentColor: 'bg-orange-400/10 border-orange-400/20' },
  competitor: { label: 'Competitor',  icon: Users,       color: 'text-sky-400',     accentColor: 'bg-sky-400/10 border-sky-400/20' },
  blueprint:  { label: 'Blueprint',   icon: FileCode2,   color: 'text-[#C5FF00]',   accentColor: 'bg-[#C5FF00]/10 border-[#C5FF00]/20' },
};

export default function ReportViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [dashData, setDashData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) { navigate('/login'); return; }
    supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Report not found');
          navigate('/reports');
          return;
        }
        setReport(data as Report);
        // Parse JSON dashboard data from content.
        // New format: content.json = already-parsed IntelligenceData object (JSONB)
        // Old format: content.text = raw SSE buffer string containing embedded JSON
        const content = data.content as Record<string, unknown>;
        const jsonField = content?.json;
        const textField = content?.text as string | null;

        if (jsonField && typeof jsonField === 'object') {
          // Already a parsed object — use directly (new format)
          setDashData(jsonField as IntelligenceData);
        } else if (typeof jsonField === 'string' && jsonField.trim()) {
          // Stored as a string — parse it
          const parsed = extractIntelligenceJSON(jsonField);
          if (parsed) setDashData(parsed as IntelligenceData);
        } else if (textField) {
          // Old format: try to extract JSON from raw SSE buffer text
          const parsed = extractIntelligenceJSON(textField);
          if (parsed) setDashData(parsed as IntelligenceData);
        }
        setLoading(false);
      });
  }, [id, user, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48 bg-muted rounded-lg" />
          <Skeleton className="h-40 bg-muted rounded-xl" />
          <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 bg-muted rounded-xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!report) return null;

  const meta = TYPE_META[report.type] ?? { label: report.type, icon: FileText, color: 'text-muted-foreground', accentColor: 'bg-muted border-border/40' };
  const Icon = meta.icon;
  const idea = (report.content as Record<string, unknown>)?.idea as string ?? report.title;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center shrink-0', meta.accentColor)}>
            <Icon className={cn('w-3.5 h-3.5', meta.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">{report.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={cn('text-[10px]', meta.accentColor, meta.color)}>{meta.label}</Badge>
              <span className="text-xs text-white/20">
                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {dashData ? (
          <IntelligenceDashboard
            data={dashData}
            isLoading={false}
            progress={100}
            sources={[]}
            idea={idea}
            onActionNavigate={(path, q) => navigate(`${path}?q=${encodeURIComponent(q)}`)}
          />
        ) : (
          <div className="text-center py-24">
            <div className={cn('w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4', meta.accentColor)}>
              <Icon className={cn('w-7 h-7', meta.color)} />
            </div>
            <h3 className="text-base font-semibold text-white/60 mb-2">Dashboard unavailable</h3>
            <p className="text-sm text-white/25 max-w-xs mx-auto text-pretty">
              This report was saved in an older format. Regenerate it to get the full intelligence dashboard.
            </p>
            <Button
              className="mt-5 h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                const path = report.type === 'validation' ? '/validation'
                  : report.type === 'mvp' ? '/mvp-planner'
                  : report.type === 'launch' ? '/launch-agent'
                  : report.type === 'competitor' ? '/competitors'
                  : '/research';
                navigate(`${path}?q=${encodeURIComponent(idea)}`);
              }}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Regenerate
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
