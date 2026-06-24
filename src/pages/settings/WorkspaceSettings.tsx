import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, FieldLabel, Divider, RadioCard, ToggleRow, SaveBar } from '@/components/settings/SettingsAtoms';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { applyTheme, VALID_THEMES, type ThemeName } from '@/lib/theme';

// Theme swatch visual config
const THEME_SWATCHES: { key: ThemeName; bg: string; accent: string; dot1: string; dot2: string; dot3: string }[] = [
  { key: 'Dark',     bg: 'bg-[#070B14]', accent: '#5B8CFF', dot1: '#1a2540', dot2: '#1e2d4d', dot3: '#253660' },
  { key: 'Midnight', bg: 'bg-[#0a0014]', accent: '#8B5CF6', dot1: '#1a0038', dot2: '#200045', dot3: '#280058' },
  { key: 'Graphite', bg: 'bg-[#141414]', accent: '#4a9eff', dot1: '#222226', dot2: '#28282e', dot3: '#2e2e36' },
  { key: 'Obsidian', bg: 'bg-[#060d0d]', accent: '#2dd4bf', dot1: '#0d1a1a', dot2: '#102020', dot3: '#132828' },
  { key: 'Light',    bg: 'bg-[#f0f4ff]', accent: '#3b82f6', dot1: '#dde6ff', dot2: '#cfdaff', dot3: '#c2d1ff' },
];

export default function WorkspaceSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [theme,         setTheme]         = useState<ThemeName>('Dark');
  const [density,       setDensity]       = useState('Compact');
  const [landingPage,   setLandingPage]   = useState('Opportunities');
  const [autoSave,      setAutoSave]      = useState(true);
  const [exportFmt,     setExportFmt]     = useState('PDF');
  const [storeDuration, setStoreDuration] = useState('90 Days');
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);
  // hoveredTheme drives live preview without committing to state
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    const ws = (profile as any)?.workspace_settings;
    if (ws && Object.keys(ws).length > 0) {
      if (ws.theme)         setTheme(ws.theme as ThemeName);
      if (ws.density)       setDensity(ws.density);
      if (ws.landingPage)   setLandingPage(ws.landingPage);
      if (typeof ws.autoSave === 'boolean') setAutoSave(ws.autoSave);
      if (ws.exportFmt)     setExportFmt(ws.exportFmt);
      if (ws.storeDuration) setStoreDuration(ws.storeDuration);
    }
  }, [profile]);

  const mark = () => setDirty(true);

  // Live preview: apply on hover, revert on leave
  const handleSwatchHover = (t: ThemeName) => {
    setHoveredTheme(t);
    applyTheme(t);
  };
  const handleSwatchLeave = () => {
    setHoveredTheme(null);
    applyTheme(theme); // revert to currently selected (not yet saved) theme
  };

  // Click commits selection + keeps preview applied
  const handleSwatchClick = (t: ThemeName) => {
    setTheme(t);
    applyTheme(t);
    mark();
  };

  const handleSave = useCallback(async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    setSaving(true);
    const payload = { theme, density, landingPage, autoSave, exportFmt, storeDuration };
    const { error } = await supabase
      .from('profiles')
      .update({ workspace_settings: payload })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save workspace settings'); return; }
    await refreshProfile();
    toast.success('Workspace settings saved');
    setDirty(false);
  }, [user, theme, density, landingPage, autoSave, exportFmt, storeDuration, refreshProfile]);

  const handleDiscard = () => {
    // Revert live theme to DB-saved value
    const ws = (profile as any)?.workspace_settings;
    const saved = (ws?.theme as ThemeName) ?? 'Dark';
    setTheme(saved);
    applyTheme(saved);
    setDirty(false);
  };

  // Active swatch for highlight: hoveredTheme takes precedence during preview
  const activeKey = hoveredTheme ?? theme;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-foreground tracking-tight">Workspace</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Customize the platform experience to match your workflow.</p>
      </div>

      <Card className="space-y-6">
        <div>
          <FieldLabel>Theme</FieldLabel>
          <p className="text-[11px] text-muted-foreground mb-3">Hover to preview · click to select</p>
          <div className="flex gap-4 flex-wrap">
            {THEME_SWATCHES.map(({ key, bg, accent, dot1, dot2, dot3 }) => {
              const isActive = activeKey === key;
              const isSelected = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSwatchClick(key)}
                  onMouseEnter={() => handleSwatchHover(key)}
                  onMouseLeave={handleSwatchLeave}
                  className={cn(
                    'flex flex-col items-center gap-2 group transition-all duration-150 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm',
                  )}
                >
                  {/* Swatch card preview */}
                  <div
                    className={cn(
                      'w-20 h-14 rounded-xl border-2 overflow-hidden transition-all duration-150',
                      bg,
                      isActive
                        ? 'border-[--preview-accent] scale-105 shadow-lg'
                        : 'border-transparent opacity-60 group-hover:opacity-80',
                    )}
                    style={{ '--preview-accent': accent } as React.CSSProperties}
                  >
                    {/* Mini sidebar strip */}
                    <div className="flex h-full">
                      <div
                        className="w-3 h-full flex flex-col gap-1 items-center py-1.5"
                        style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)` }}
                      >
                        {[0,1,2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? accent : dot1 }} />
                        ))}
                      </div>
                      {/* Mini content area */}
                      <div className="flex-1 p-1.5 space-y-1">
                        <div className="h-1.5 rounded-full w-full" style={{ background: dot2 }} />
                        <div className="h-1.5 rounded-full w-3/4" style={{ background: dot1 }} />
                        <div className="flex gap-1 mt-1">
                          <div className="h-4 flex-1 rounded" style={{ background: dot2 }} />
                          <div className="h-4 flex-1 rounded" style={{ background: dot3 }} />
                        </div>
                        {/* Accent pill */}
                        <div className="h-1.5 rounded-full w-1/2" style={{ background: accent, opacity: 0.7 }} />
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        'text-[10px] font-semibold transition-colors duration-150',
                        isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {key}
                    </span>
                    {/* Dot indicator for saved selection */}
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full transition-all duration-150',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                      style={{ background: accent }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <FieldLabel>Dashboard Density</FieldLabel>
            <RadioCard value={density} onChange={v => { setDensity(v); mark(); }}
              options={['Comfortable','Compact','Dense'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Default Landing Page</FieldLabel>
            <RadioCard value={landingPage} onChange={v => { setLandingPage(v); mark(); }}
              options={['Opportunities','Trending','Reports','Watchlist','Research Agent'].map(k => ({ key: k, label: k }))}/>
          </div>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <FieldLabel>Export Format</FieldLabel>
            <RadioCard value={exportFmt} onChange={v => { setExportFmt(v); mark(); }}
              options={['PDF','DOCX','Markdown','CSV'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Report Storage</FieldLabel>
            <RadioCard value={storeDuration} onChange={v => { setStoreDuration(v); mark(); }}
              options={['30 Days','90 Days','1 Year','Unlimited'].map(k => ({ key: k, label: k }))}/>
          </div>
        </div>
        <Divider />
        <ToggleRow label="Auto Save Reports"
          description="Automatically save all generated reports to your workspace."
          value={autoSave} onChange={v => { setAutoSave(v); mark(); }}/>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} label="Save Workspace"/>
    </div>
  );
}
