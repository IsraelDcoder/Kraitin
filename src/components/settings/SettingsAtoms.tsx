import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Check } from 'lucide-react';
import { useState } from 'react';

/* ── Section header ─────────────────────────────────────────── */
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-[13px] text-white/35 mt-1 leading-relaxed text-pretty">{subtitle}</p>}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/[0.07] bg-[#0a0b0f] p-5', className)}>
      {children}
    </div>
  );
}

/* ── Field label ────────────────────────────────────────────── */
export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-2">
      {children}{required && <span className="text-[#C5FF00]/60 ml-1">*</span>}
    </label>
  );
}

/* ── Divider ────────────────────────────────────────────────── */
export function Divider() {
  return <div className="h-px bg-white/[0.04] my-5" />;
}

/* ── Toggle row ─────────────────────────────────────────────── */
export function ToggleRow({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white/70">{label}</p>
        {description && <p className="text-[11px] text-white/30 mt-0.5 text-pretty">{description}</p>}
      </div>
      <Switch
        checked={value} onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-[#C5FF00] data-[state=checked]:[--switch-thumb-color:#000]"
      />
    </div>
  );
}

/* ── Chip select ────────────────────────────────────────────── */
export function ChipSelect({ options, selected, onChange, multi = true }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; multi?: boolean;
}) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
    } else {
      onChange(selected[0] === opt ? [] : [opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => toggle(opt)}
          className={cn('h-7 px-3 rounded-full border text-xs font-medium transition-all',
            selected.includes(opt)
              ? 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]'
              : 'border-white/[0.07] text-white/35 hover:border-white/20 hover:text-white/65')}>
          {selected.includes(opt) && <span className="mr-1 text-[10px]">✓</span>}
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ── Radio card ─────────────────────────────────────────────── */
export function RadioCard({ options, value, onChange }: {
  options: Array<{ key: string; label: string; desc?: string }>;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={cn('text-left p-3.5 rounded-xl border transition-all',
            value === opt.key
              ? 'bg-[#C5FF00]/[0.06] border-[#C5FF00]/25 text-[#C5FF00]'
              : 'border-white/[0.06] text-white/50 hover:border-white/15 hover:text-white/75')}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">{opt.label}</span>
            {value === opt.key && <Check className="w-3.5 h-3.5 text-[#C5FF00] shrink-0" />}
          </div>
          {opt.desc && <p className="text-[11px] text-white/30 mt-1 leading-snug text-pretty">{opt.desc}</p>}
        </button>
      ))}
    </div>
  );
}

/* ── Integration row ────────────────────────────────────────── */
export function IntegrationRow({ name, icon, connected, lastSync, onConnect, action, loading, comingSoon }: {
  name: string; icon: string; connected: boolean; lastSync?: string;
  onConnect?: () => void; action?: React.ReactNode; loading?: boolean; comingSoon?: boolean;
}) {
  const [state, setState] = useState(connected);
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-base shrink-0">
          {icon}
        </div>
        <div>
          <p className={cn('text-[13px] font-medium', comingSoon ? 'text-white/35' : 'text-white/75')}>{name}</p>
          {state && lastSync
            ? <p className="text-[10px] text-white/25 mt-0.5">Synced {lastSync}</p>
            : <p className="text-[10px] text-white/20 mt-0.5">{comingSoon ? 'On the roadmap' : 'Not connected'}</p>}
        </div>
      </div>
      {comingSoon ? (
        <span className="h-7 px-3 rounded-lg border border-white/[0.06] text-[11px] font-semibold text-white/20 bg-white/[0.02] flex items-center select-none">
          Coming Soon
        </span>
      ) : action ? action : (
        <button onClick={() => { if (onConnect) { onConnect(); } else { setState(s => !s); } }}
          disabled={loading}
          className={cn('h-7 px-3 rounded-lg border text-[11px] font-semibold transition-all disabled:opacity-40',
            state
              ? 'border-white/[0.08] text-white/35 hover:border-red-400/30 hover:text-red-400'
              : 'border-[#C5FF00]/25 text-[#C5FF00] bg-[#C5FF00]/[0.06] hover:bg-[#C5FF00]/10')}>
          {loading ? '…' : state ? 'Disconnect' : 'Connect'}
        </button>
      )}
    </div>
  );
}

/* ── Save bar ───────────────────────────────────────────────── */
export function SaveBar({ dirty, saving, onSave, onDiscard, label = 'Save Changes' }: {
  dirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void; label?: string;
}) {
  if (!dirty) return null;
  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-4 px-6 h-14
      bg-[#0a0b0f]/95 backdrop-blur-md border-t border-white/[0.08] mt-6">
      <div className="flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[13px] text-white/50 font-medium">Unsaved changes</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onDiscard}
          className="h-8 px-3.5 rounded-lg border border-white/[0.08] text-[12px] text-white/35 hover:text-white/65 hover:border-white/18 transition-all">
          Discard
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#C5FF00] text-black text-[12px] font-bold hover:bg-[#C5FF00]/90 transition-all disabled:opacity-70">
          {saving
            ? <><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving…</>
            : label}
        </button>
      </div>
    </div>
  );
}
