import { cn } from '@/lib/utils';
import { X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';

/* ── Types ──────────────────────────────────────────────────── */
export interface AdvancedFilters {
  scoreMin: number;
  scoreMax: number;
  competition: ('low' | 'medium' | 'high')[];
  growthMin: number;
  marketSize: string;   // 'all' | '<$1B' | '$1B-$10B' | '>$10B'
  hiddenGemsOnly: boolean;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  scoreMin: 0,
  scoreMax: 100,
  competition: [],
  growthMin: 0,
  marketSize: 'all',
  hiddenGemsOnly: false,
};

export function isFiltersActive(f: AdvancedFilters): boolean {
  return (
    f.scoreMin > 0 || f.scoreMax < 100 ||
    f.competition.length > 0 || f.growthMin > 0 ||
    f.marketSize !== 'all' || f.hiddenGemsOnly
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/25 mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.05] my-5" />;
}

/* ── Pill toggle ─────────────────────────────────────────────── */
function Pill({
  label, active, onClick, color,
}: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 px-3 rounded-full border text-xs font-medium transition-all',
        active
          ? color ?? 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]'
          : 'border-white/[0.07] text-white/30 hover:border-white/20 hover:text-white/60',
      )}
    >
      {label}
    </button>
  );
}

/* ── Dual range value display ────────────────────────────────── */
function RangeValue({ lo, hi, unit = '' }: { lo: number; hi: number; unit?: string }) {
  return (
    <span className="text-xs font-mono text-white/50 tabular-nums">
      {unit}{lo} – {unit}{hi}
      {hi === 100 && unit === '' ? '+' : ''}
    </span>
  );
}

/* ── Main component ─────────────────────────────────────────── */
interface Props {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onChange: (f: AdvancedFilters) => void;
}

const COMPETITION_OPTIONS: { key: 'low' | 'medium' | 'high'; label: string; color: string }[] = [
  { key: 'low',    label: 'Low',    color: 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]' },
  { key: 'medium', label: 'Medium', color: 'bg-amber-400/10 border-amber-400/30 text-amber-400' },
  { key: 'high',   label: 'High',   color: 'bg-red-400/10 border-red-400/30 text-red-400' },
];

const MARKET_SIZE_OPTIONS = [
  { key: 'all',     label: 'Any Size' },
  { key: '<$1B',    label: '< $1B' },
  { key: '$1B-$10B',label: '$1B – $10B' },
  { key: '>$10B',   label: '> $10B' },
];

const GROWTH_PRESETS = [
  { label: 'Any', value: 0 },
  { label: '+10%', value: 10 },
  { label: '+25%', value: 25 },
  { label: '+50%', value: 50 },
  { label: '+100%', value: 100 },
];

export function AdvancedFilterPanel({ open, onClose, filters, onChange }: Props) {
  const update = (patch: Partial<AdvancedFilters>) => onChange({ ...filters, ...patch });

  const toggleCompetition = (key: 'low' | 'medium' | 'high') => {
    const next = filters.competition.includes(key)
      ? filters.competition.filter((c) => c !== key)
      : [...filters.competition, key];
    update({ competition: next });
  };

  const activeCount = (
    (filters.scoreMin > 0 || filters.scoreMax < 100 ? 1 : 0) +
    (filters.competition.length > 0 ? 1 : 0) +
    (filters.growthMin > 0 ? 1 : 0) +
    (filters.marketSize !== 'all' ? 1 : 0) +
    (filters.hiddenGemsOnly ? 1 : 0)
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full max-w-[380px] p-0 bg-[#060709] border-l border-white/[0.07] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.05] shrink-0 sticky top-0 bg-[#060709] z-10">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-white/40" />
            <span className="text-sm font-bold text-white/80">Advanced Filters</span>
            {activeCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C5FF00]/15 text-[#C5FF00] font-bold border border-[#C5FF00]/20">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={() => onChange({ ...DEFAULT_ADVANCED_FILTERS })}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-white/[0.07] text-[11px] text-white/35 hover:text-white/65 hover:border-white/18 transition-all"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white/70 hover:bg-white/[0.05] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-0">

          {/* ── Opportunity Score Range ─────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Opportunity Score</SectionLabel>
              <RangeValue lo={filters.scoreMin} hi={filters.scoreMax} />
            </div>
            <div className="px-1 pb-1">
              <Slider
                min={0}
                max={100}
                step={5}
                value={[filters.scoreMin, filters.scoreMax]}
                onValueChange={([lo, hi]) => update({ scoreMin: lo, scoreMax: hi })}
                className="[&_[data-orientation=horizontal]]:h-1 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-[#C5FF00]/50 [&_[role=slider]]:bg-[#0a0b0f] [&_[role=slider]]:focus-visible:ring-[#C5FF00]/30 [&_.range]:bg-[#C5FF00]"
              />
            </div>
            {/* Quick presets */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {[
                { label: 'Any', lo: 0, hi: 100 },
                { label: '70+', lo: 70, hi: 100 },
                { label: '80+', lo: 80, hi: 100 },
                { label: '90+', lo: 90, hi: 100 },
              ].map(({ label, lo, hi }) => (
                <Pill
                  key={label}
                  label={label}
                  active={filters.scoreMin === lo && filters.scoreMax === hi}
                  onClick={() => update({ scoreMin: lo, scoreMax: hi })}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* ── Competition Level ───────────────────────────────── */}
          <div>
            <SectionLabel>Competition Level</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {COMPETITION_OPTIONS.map(({ key, label, color }) => (
                <Pill
                  key={key}
                  label={label}
                  active={filters.competition.includes(key)}
                  onClick={() => toggleCompetition(key)}
                  color={color}
                />
              ))}
              {filters.competition.length > 0 && (
                <button
                  onClick={() => update({ competition: [] })}
                  className="h-7 px-2.5 rounded-full border border-white/[0.06] text-[11px] text-white/25 hover:text-white/50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {filters.competition.length === 0 && (
              <p className="text-[11px] text-white/20 mt-2">Showing all competition levels</p>
            )}
          </div>

          <Divider />

          {/* ── Minimum Growth Rate ─────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Minimum Growth Rate</SectionLabel>
              <span className="text-xs font-mono text-white/50">
                {filters.growthMin > 0 ? `+${filters.growthMin}%` : 'Any'}
              </span>
            </div>
            <div className="px-1 pb-1">
              <Slider
                min={0}
                max={200}
                step={5}
                value={[filters.growthMin]}
                onValueChange={([v]) => update({ growthMin: v })}
                className="[&_[data-orientation=horizontal]]:h-1 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-[#C5FF00]/50 [&_[role=slider]]:bg-[#0a0b0f] [&_[role=slider]]:focus-visible:ring-[#C5FF00]/30"
              />
            </div>
            {/* Growth presets */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {GROWTH_PRESETS.map(({ label, value }) => (
                <Pill
                  key={label}
                  label={label}
                  active={filters.growthMin === value}
                  onClick={() => update({ growthMin: value })}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* ── Market Size ─────────────────────────────────────── */}
          <div>
            <SectionLabel>Market Size</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {MARKET_SIZE_OPTIONS.map(({ key, label }) => (
                <Pill
                  key={key}
                  label={label}
                  active={filters.marketSize === key}
                  onClick={() => update({ marketSize: key })}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* ── Hidden Gems ─────────────────────────────────────── */}
          <div>
            <SectionLabel>Special Filters</SectionLabel>
            <button
              onClick={() => update({ hiddenGemsOnly: !filters.hiddenGemsOnly })}
              className={cn(
                'flex items-center gap-3 w-full h-10 px-3.5 rounded-xl border text-sm font-medium transition-all',
                filters.hiddenGemsOnly
                  ? 'bg-[#C5FF00]/[0.06] border-[#C5FF00]/25 text-[#C5FF00]'
                  : 'border-white/[0.07] text-white/40 hover:border-white/15 hover:text-white/65',
              )}
            >
              <span className="text-base">⭐</span>
              Hidden Gems Only
              {filters.hiddenGemsOnly && (
                <span className="ml-auto text-[10px] bg-[#C5FF00]/15 text-[#C5FF00] px-1.5 py-0.5 rounded-full border border-[#C5FF00]/20">
                  ON
                </span>
              )}
            </button>
          </div>

          <Divider />

          {/* ── Apply CTA ───────────────────────────────────────── */}
          <div className="pt-1 pb-4">
            <button
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-[#C5FF00] text-black text-sm font-black hover:bg-[#C5FF00]/90 transition-all"
            >
              Apply Filters{activeCount > 0 ? ` (${activeCount} active)` : ''}
            </button>
            {activeCount > 0 && (
              <button
                onClick={() => { onChange({ ...DEFAULT_ADVANCED_FILTERS }); onClose(); }}
                className="w-full h-9 mt-2 rounded-xl border border-white/[0.07] text-xs text-white/30 hover:text-white/60 hover:border-white/15 transition-all"
              >
                Clear All & Close
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
