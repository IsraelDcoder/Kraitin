import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ExternalLink, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentTask {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

interface RecentTasksProps {
  /** report type filter — 'research' | 'validation' | 'mvp' | 'launch' | 'competitor' | 'blueprint' */
  reportType: string;
  userId: string | undefined;
  /** label shown in section heading e.g. "Recent Research" */
  label: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? 'Yesterday' : `${d} days ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'Just now';
}

export function RecentTasks({ reportType, userId, label }: RecentTasksProps) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('reports')
      .select('id, title, type, status, created_at')
      .eq('user_id', userId)
      .eq('type', reportType)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [userId, reportType]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) { toast.error('Could not delete report'); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Report deleted');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-white/20 uppercase tracking-wider mb-3">{label}</p>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 bg-white/[0.03] rounded-xl" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-white/20 uppercase tracking-wider mb-3">{label}</p>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-5 text-center">
          <Clock className="w-5 h-5 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/20">No reports yet — generate your first one above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/20 uppercase tracking-wider mb-3">{label}</p>
      <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer group"
            onClick={() => navigate(`/report/${task.id}`)}
          >
            {/* Status dot */}
            <div className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              task.status === 'completed' ? 'bg-emerald-400' : 'bg-white/20'
            )} />

            {/* Title + time */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70 truncate group-hover:text-white/90 transition-colors">
                {task.title.replace(/^(Research|Validation|MVP Plan|Launch Plan|Competitor):\s*/i, '')}
              </p>
              <p className="text-[11px] text-white/20 mt-0.5">{timeAgo(task.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white/30 hover:text-white/70 hover:bg-white/[0.05]"
                onClick={() => navigate(`/report/${task.id}`)}
                title="Open report"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white/20 hover:text-red-400 hover:bg-red-400/10"
                onClick={(e) => handleDelete(e, task.id)}
                title="Delete report"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Always-visible open arrow on mobile */}
            <ExternalLink className="w-3 h-3 text-white/10 group-hover:hidden shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
