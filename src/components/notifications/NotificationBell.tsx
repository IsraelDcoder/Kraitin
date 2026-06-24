import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X, FileText, Zap, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types/types';

const TYPE_META: Record<string, { icon: typeof Info; color: string }> = {
  report: { icon: FileText, color: 'text-[#C5FF00]' },
  ai: { icon: Zap, color: 'text-[#C5FF00]' },
  billing: { icon: CreditCard, color: 'text-amber-400' },
  alert: { icon: AlertTriangle, color: 'text-red-400' },
  default: { icon: Info, color: 'text-white/50' },
};

function NotificationItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const meta = TYPE_META[notif.type] ?? TYPE_META.default;
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notif.is_read ? 'opacity-50 hover:bg-white/[0.02]' : 'bg-white/[0.03] hover:bg-white/[0.05]'
      )}
      onClick={() => onRead(notif.id)}
    >
      <div className={cn('w-7 h-7 rounded-md border flex items-center justify-center shrink-0', meta.color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80 truncate">{notif.title}</p>
        {notif.message && <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{notif.message}</p>}
        <p className="text-[10px] text-white/20 mt-1">
          {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#C5FF00] shrink-0 mt-1" />}
    </div>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) refresh(); }}
        className="relative w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#C5FF00] text-black text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-[24rem] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0a0b0f] shadow-2xl z-50 p-3 space-y-2">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.05]">
            <p className="text-xs font-bold text-white/60">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[#C5FF00]/60 hover:text-[#C5FF00] flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-6 text-center">
              <span className="w-5 h-5 border-2 border-white/20 border-t-[#C5FF00] rounded-full animate-spin inline-block" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Bell className="w-6 h-6 text-white/15 mx-auto" />
              <p className="text-xs text-white/30">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notif={n} onRead={(id) => { markAsRead(id); }} />
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-white/[0.05] text-center">
            <Link
              to="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              Notification Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
