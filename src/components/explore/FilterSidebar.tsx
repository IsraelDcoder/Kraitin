import { cn } from '@/lib/utils';
import { Sliders, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FilterState {
  minScore: number;
  maxScore: number;
  competition: 'all' | 'low' | 'medium' | 'high';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  type: 'all' | 'B2B' | 'B2C' | 'AI' | 'Mobile' | 'SaaS';
  minGrowth: number;
}

export const DEFAULT_FILTERS: FilterState = {
  minScore: 0,
  maxScore: 100,
  competition: 'all',
  difficulty: 'all',
  type: 'all',
  minGrowth: 0,
};

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose?: () => void;
  className?: string;
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 px-3 rounded-md text-xs font-medium border transition-all whitespace-nowrap',
        active ? 'bg-[#C5FF00] text-black border-[#C5FF00]' : 'text-white/40 border-white/[0.08] hover:border-white/20 hover:text-white/70'
      )}
    >
      {label}
    </button>
  );
}

function RangeRow({ label, value, min, max, step, onChange, suffix = '' }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-xs text-white/60 font-mono">{value}{suffix}+</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C5FF00] [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

export function FilterSidebar({ filters, onChange, onClose, className }: FilterSidebarProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });
  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-white/40" />
          <span className="text-sm font-semibold text-white/80">Filters</span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Reset
            </button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-white/30 hover:text-white/70" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Opportunity Score */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Opportunity Score</p>
          <RangeRow label="Minimum Score" value={filters.minScore} min={0} max={90} step={5} onChange={(v) => set({ minScore: v })} />
        </div>

        {/* Growth */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Monthly Growth</p>
          <RangeRow label="Minimum Growth" value={filters.minGrowth} min={0} max={80} step={5} onChange={(v) => set({ minGrowth: v })} suffix="%" />
        </div>

        {/* Competition */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Competition Level</p>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'low', 'medium', 'high'] as const).map((v) => (
              <FilterChip key={v} label={v === 'all' ? 'Any' : v.charAt(0).toUpperCase() + v.slice(1)}
                active={filters.competition === v} onClick={() => set({ competition: v })} />
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Launch Difficulty</p>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'easy', 'medium', 'hard'] as const).map((v) => (
              <FilterChip key={v} label={v === 'all' ? 'Any' : v.charAt(0).toUpperCase() + v.slice(1)}
                active={filters.difficulty === v} onClick={() => set({ difficulty: v })} />
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Product Type</p>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'B2B', 'B2C', 'AI', 'Mobile', 'SaaS'] as const).map((v) => (
              <FilterChip key={v} label={v === 'all' ? 'Any' : v}
                active={filters.type === v} onClick={() => set({ type: v })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
