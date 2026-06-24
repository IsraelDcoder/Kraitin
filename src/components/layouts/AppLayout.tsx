import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useGuide } from '@/contexts/GuideContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Compass, FlaskConical, ShieldCheck, Users, Code2, Rocket,
  FileText, CreditCard, Settings, Menu, Zap, LogOut, ChevronRight,
  DollarSign, TrendingUp, Star, Gem, Bot, Building2,
  Smartphone, Bookmark, Eye, Layers, Map, BarChart3,
  PanelLeftClose, PanelLeftOpen, Sparkles, PenLine, FileCode2, Coins,
  LayoutDashboard,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SupportChat } from '@/components/support/SupportChat';
import { FirstTimeGuideModal } from '@/components/onboarding/FirstTimeGuideModal';
import { KraitinLogo } from '@/components/ui/KraitinLogo';

/* ── Sidebar context ───────────────────────────────────────── */
const SidebarCtx = createContext({ collapsed: false });
export function useSidebar() { return useContext(SidebarCtx); }

/* ── Nav structure ─────────────────────────────────────────── */
interface NavItem { icon: React.ElementType; label: string; path: string; badge?: string; }
interface NavGroup { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: 'KIRA AI',
    items: [
      { icon: Sparkles, label: 'Ask Kira', path: '/kira', badge: 'AI' },
    ],
  },
  {
    label: 'EXPLORE',
    items: [
      { icon: LayoutDashboard, label: 'Command Center',    path: '/dashboard' },
      { icon: Compass,    label: 'Opportunities',    path: '/opportunities' },
      { icon: TrendingUp, label: 'Trending',          path: '/opportunities?filter=trending' },
      { icon: BarChart3,  label: 'Rising',            path: '/opportunities?filter=rising' },
      { icon: Gem,        label: 'Hidden Gems',       path: '/opportunities?filter=gems' },
      { icon: Bot,        label: 'AI Apps',           path: '/opportunities?cat=AI' },
      { icon: Building2,  label: 'B2B SaaS',          path: '/opportunities?cat=B2B+SaaS' },
      { icon: Users,      label: 'Consumer Apps',     path: '/opportunities?cat=Consumer' },
      { icon: Smartphone, label: 'Mobile Apps',       path: '/opportunities?cat=Mobile+Apps' },
    ],
  },
  {
    label: 'RESEARCH',
    items: [
      { icon: FlaskConical, label: 'Research Agent',    path: '/research',           badge: 'AI' },
      { icon: ShieldCheck,  label: 'Validation Agent',  path: '/validation',         badge: 'AI' },
      { icon: Zap,          label: 'Startup Teardown',  path: '/teardown',           badge: 'PRO' },
      { icon: Code2,        label: 'MVP Planner',       path: '/mvp-planner',        badge: 'AI' },
      { icon: Rocket,       label: 'Launch Agent',      path: '/launch-agent',       badge: 'AI' },
      { icon: FileCode2,    label: 'Blueprint Agent',   path: '/blueprint',          badge: 'AI' },
      { icon: PenLine,      label: 'Content Generator', path: '/content-generator',  badge: 'AI' },
    ],
  },
  {
    label: 'WORKSPACE',
    items: [
      { icon: FileText,  label: 'Saved Reports', path: '/reports' },
      { icon: Bookmark,  label: 'Watchlist',      path: '/watchlist' },
      { icon: Layers,    label: 'Blueprints',     path: '/reports?tab=blueprints' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { icon: CreditCard, label: 'Billing',   path: '/billing' },
      { icon: DollarSign, label: 'Affiliate', path: '/affiliate/dashboard' },
      { icon: Settings,   label: 'Settings',  path: '/settings' },
    ],
  },
];

/* ── Single nav item ───────────────────────────────────────── */
function NavLink({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <Link to={item.path} onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'nav-item-press flex items-center h-8 rounded-md text-[13px] font-medium group relative',
        collapsed ? 'justify-center px-0 w-10 mx-auto' : 'gap-2.5 px-2.5',
        active
          ? 'bg-[#C5FF00]/[0.08] text-[#C5FF00]'
          : 'text-white/35 hover:text-white/75 hover:bg-white/[0.04]'
      )}>
      {/* Active indicator bar */}
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-[#C5FF00]" />
      )}
      <item.icon className={cn(
        'w-3.5 h-3.5 shrink-0 transition-all duration-150',
        active
          ? 'text-[#C5FF00] scale-110'
          : 'text-white/25 group-hover:text-white/50 group-hover:scale-110'
      )} />
      {!collapsed && <>
        <span className="flex-1 min-w-0 truncate">{item.label}</span>
        {item.badge && (
          <span className={cn(
            'text-[9px] px-1 py-0 rounded font-mono border shrink-0',
            item.badge === 'PRO'
              ? 'bg-[#C5FF00]/15 text-[#C5FF00] border-[#C5FF00]/30'
              : 'bg-[#C5FF00]/10 text-[#C5FF00]/70 border-[#C5FF00]/15'
          )}>
            {item.badge}
          </span>
        )}
      </>}
    </Link>
  );
}

/* ── Sidebar content ───────────────────────────────────────── */
function SidebarContent({
  collapsed, onCollapse, onNavClick,
}: {
  collapsed: boolean; onCollapse?: () => void; onNavClick?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, subscription, signOut } = useAuth();
  const { openGuide } = useGuide();

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const isActive = (path: string) => {
    const base = path.split('?')[0];
    const qs = path.includes('?') ? path.split('?')[1] : '';
    if (location.pathname !== base && !location.pathname.startsWith(base + '/')) return false;
    // For links with query params, also match the current search string
    if (qs) return location.search === '?' + qs;
    // For plain-path links only highlight exact base match (no sub-path spill)
    return location.pathname === base;
  };

  const tierBadge: Record<string, string> = {
    starter: 'text-sky-400', pro: 'text-amber-400', founder: 'text-[#C5FF00]',
  };

  return (
    <div className="flex flex-col h-full bg-[#060709] border-r border-white/[0.06]"
      style={{ boxShadow: '1px 0 0 0 rgba(255,255,255,0.04)' }}>

      {/* Logo */}
      <Link to="/dashboard" onClick={onNavClick}
        className={cn(
          'flex items-center h-16 border-b border-white/[0.05] shrink-0 hover:bg-white/[0.02] transition-colors',
          collapsed ? 'justify-center px-0' : 'px-5'
        )}>
        <KraitinLogo
          variant={collapsed ? 'icon' : 'full'}
          size={collapsed ? 'sm' : 'lg'}
          subtitle={!collapsed}
        />
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-5 scrollbar-none">
        {NAV.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {!collapsed && (
              <p className="text-[9px] font-bold text-white/18 tracking-[0.14em] px-2.5 pb-1.5 uppercase">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-white/[0.05] mx-1 mb-2" />}
            {group.items.map((item) => (
              <NavLink
                key={item.path + item.label}
                item={item}
                active={isActive(item.path)}
                collapsed={collapsed}
                onClick={onNavClick}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('shrink-0 py-3 border-t border-white/[0.05] space-y-2', collapsed ? 'px-0' : 'px-3')}>
        {/* Collapse toggle — desktop only */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'btn-press flex items-center justify-center w-full h-8 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.04]',
              collapsed ? 'w-10 mx-auto' : ''
            )}>
            {collapsed
              ? <PanelLeftOpen className="w-3.5 h-3.5" />
              : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Take the tour button */}
        <button
          onClick={() => { onNavClick?.(); openGuide(); }}
          title={collapsed ? 'Take the tour' : undefined}
          className={cn(
            'btn-press flex items-center h-8 rounded-md text-white/25 hover:text-[#C5FF00]/70 hover:bg-[#C5FF00]/[0.04] transition-all w-full',
            collapsed ? 'justify-center px-0 w-10 mx-auto' : 'gap-2.5 px-2.5'
          )}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Take the tour</span>}
        </button>

        {!collapsed && (
          <>
            {subscription && subscription.tier !== 'free' && (() => {
              const remaining = subscription.credits_remaining ?? 0;
              const total     = subscription.monthly_credits   ?? 500;
              const pct       = total > 0 ? Math.round((remaining / total) * 100) : 0;
              const isLow     = pct < 20;
              return (
                <Link to="/billing"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.03] transition-all group">
                  <Coins className={cn('w-3 h-3 shrink-0', isLow ? 'text-amber-400' : 'text-[#C5FF00]/60')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn('text-[10px] font-bold', isLow ? 'text-amber-400' : 'text-white/50')}>
                        {remaining.toLocaleString()} / {total.toLocaleString()}
                      </span>
                      {isLow && (
                        <span className="text-[8px] font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-1 rounded-full">Low</span>
                      )}
                    </div>
                    <div className="h-0.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', isLow ? 'bg-amber-400' : 'bg-[#C5FF00]')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })()}
            {subscription?.tier === 'free' && (
              <Link to="/billing"
                className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-[#C5FF00]/[0.05] border border-[#C5FF00]/15 hover:bg-[#C5FF00]/10 transition-all">
                <Star className="w-3 h-3 text-[#C5FF00]/60 shrink-0" />
                <span className="text-[11px] text-[#C5FF00]/70 font-semibold">Upgrade To Pro</span>
              </Link>
            )}
          </>
        )}

        <div className={cn('flex items-center gap-2.5 px-1', collapsed && 'justify-center px-0')}>
          <div className="w-7 h-7 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-[#C5FF00]/80">
              {(profile?.username || profile?.email || 'F')[0].toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/60 truncate">
                  {profile?.username || profile?.email?.split('@')[0] || 'Founder'}
                </p>
              </div>
              <button onClick={handleSignOut}
                className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors rounded">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar widths ────────────────────────────────────────── */
const W_EXPANDED  = 280;
const W_COLLAPSED =  72;

/* ── Main layout ───────────────────────────────────────────── */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('sidebar-collapsed') === 'true'
  );
  const navigate = useNavigate();

  /* Persist preference */
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const sidebarW = collapsed ? W_COLLAPSED : W_EXPANDED;

  return (
    <SidebarCtx.Provider value={{ collapsed }}>
      {/* First-time guide modal — available on all authenticated pages */}
      <FirstTimeGuideModal />
      <div className="flex h-screen overflow-hidden bg-[#050507]">
        {/* ── Desktop sidebar: fixed, animates width ───────────── */}
        <aside
          className="hidden lg:flex fixed top-0 left-0 h-screen z-30 flex-col"
          style={{
            width: sidebarW,
            transition: 'width 300ms cubic-bezier(0.16,1,0.3,1)',
          }}>
          <SidebarContent
            collapsed={collapsed}
            onCollapse={() => setCollapsed(c => !c)}
          />
        </aside>

        {/* ── Content column: margin tracks sidebar width ──────── */}
        <div
          className="flex-1 h-screen flex flex-col overflow-hidden min-w-0"
          style={{
            marginLeft: sidebarW,
            transition: 'margin-left 300ms cubic-bezier(0.16,1,0.3,1)',
          }}>

          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-white/[0.05] bg-[#060709]/90 backdrop-blur-sm shrink-0 z-20">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-[#060709] border-r border-white/[0.05]">
                <SidebarContent
                  collapsed={false}
                  onNavClick={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <KraitinLogo size="sm" />
            </div>
            <div className="flex-1" />
            <NotificationBell />
          </header>

          {/* Main scroll container — the single source of vertical scroll */}
          <main className="flex-1 overflow-y-auto min-h-0">
            {children}
          </main>
        </div>
      </div>
      <SupportChat />
    </SidebarCtx.Provider>
  );
}

/* ── Upgrade banner ─────────────────────────────────────────── */
export function UpgradeBanner({ requiredTier }: { requiredTier: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
        <ChevronRight className="w-6 h-6 text-amber-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Upgrade Required</h3>
        <p className="text-sm text-white/40 max-w-sm">
          This feature is available on the{' '}
          <span className="text-amber-400 font-semibold capitalize">{requiredTier}</span> plan.
        </p>
      </div>
      <Button className="bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 font-semibold" onClick={() => navigate('/billing')}>
        Upgrade Plan
      </Button>
    </div>
  );
}

/* ── Map icon ─────────────────────────────────────────────── */
export { Map };
