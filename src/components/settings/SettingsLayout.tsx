import { useLocation, useNavigate, Outlet, Navigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Sparkles, Brain, Compass, Bell, Plug, Layout,
  CreditCard, Shield, Database, LogOut, Menu,
} from 'lucide-react';
import { useState } from 'react';

/* ── Nav config ─────────────────────────────────────────────── */
const NAV = [
  { id: 'profile',              label: 'Profile',             icon: User,       path: '/settings/profile' },
  { id: 'founder-preferences',  label: 'Founder Preferences', icon: Sparkles,   path: '/settings/founder-preferences' },
  { id: 'ai-cofounder',         label: 'AI Cofounder',        icon: Brain,      path: '/settings/ai-cofounder' },
  { id: 'opportunity-feed',     label: 'Opportunity Feed',    icon: Compass,    path: '/settings/opportunity-feed' },
  { id: 'notifications',        label: 'Notifications',       icon: Bell,       path: '/settings/notifications' },
  { id: 'integrations',         label: 'Integrations',        icon: Plug,       path: '/settings/integrations' },
  { id: 'workspace',            label: 'Workspace',           icon: Layout,     path: '/settings/workspace' },
  { id: 'billing',              label: 'Billing',             icon: CreditCard, path: '/settings/billing' },
  { id: 'security',             label: 'Security',            icon: Shield,     path: '/settings/security' },
  { id: 'data-privacy',         label: 'Data & Privacy',      icon: Database,   path: '/settings/data-privacy' },
];

function NavItems({ onClick }: { onClick?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.05] shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/20 px-2">Settings</p>
      </div>
      <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon, path }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link key={id} to={path} onClick={onClick}
              className={cn(
                'flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] font-medium transition-all',
                active
                  ? 'bg-[#C5FF00]/[0.08] text-[#C5FF00]'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
              )}>
              <Icon className={cn('w-3.5 h-3.5 shrink-0 transition-colors',
                active ? 'text-[#C5FF00]' : 'text-white/25')} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 px-5 py-4 border-t border-white/[0.05]">
        <button onClick={handleSignOut}
          className="flex items-center gap-2 text-[12px] text-white/25 hover:text-red-400 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

export function SettingsLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect bare /settings to /settings/profile
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/profile" replace />;
  }

  return (
    <AppLayout>
      <div className="flex h-full bg-[#050507]">

        {/* ── Settings sidebar — desktop ─────────────────────── */}
        <aside className="hidden xl:flex flex-col w-52 shrink-0 border-r border-white/[0.05] bg-[#060709] h-full">
          <NavItems />
        </aside>

        {/* ── Content column ────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Mobile settings nav trigger */}
          <div className="xl:hidden flex items-center gap-3 px-4 h-12 border-b border-white/[0.05] shrink-0 bg-[#060709]">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                  <Menu className="w-4 h-4" />
                  <span className="font-medium">
                    {NAV.find(n => location.pathname.startsWith(n.path))?.label ?? 'Settings'}
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-52 p-0 bg-[#060709] border-r border-white/[0.05]">
                <NavItems onClick={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Animated panel area */}
          <div key={location.pathname} className="flex-1 overflow-y-auto min-h-0 animate-settings-in">
            <Outlet />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
