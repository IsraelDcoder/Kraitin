import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function getScoreConfig(score: number) {
  if (score >= 90) return { label: 'Exceptional', color: 'text-[#C5FF00]', bg: 'bg-[#C5FF00]/10', border: 'border-[#C5FF00]/25', ring: '#C5FF00' };
  if (score >= 80) return { label: 'Strong',      color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25', ring: '#34d399' };
  if (score >= 70) return { label: 'Good',         color: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/25',    ring: '#38bdf8' };
  if (score >= 60) return { label: 'Moderate',     color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/25',  ring: '#fbbf24' };
  return                  { label: 'Weak',          color: 'text-white/30',   bg: 'bg-white/[0.04]', border: 'border-white/10',      ring: '#555' };
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const cfg = getScoreConfig(score);
  const textSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';
  const px = size === 'sm' ? 'px-1.5 py-0' : 'px-2 py-0.5';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border font-bold font-mono', textSize, px, cfg.color, cfg.bg, cfg.border)}>
      {score}
      {showLabel && <span className="font-normal opacity-70">{cfg.label}</span>}
    </span>
  );
}

/** Large circular score ring for the drawer */
export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const cfg = getScoreConfig(score);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={cfg.ring} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="relative text-center z-10">
        <div className={cn('font-black leading-none', cfg.color, size >= 80 ? 'text-2xl' : 'text-lg')}>{score}</div>
        <div className="text-white/30 text-[9px] font-medium mt-0.5">{cfg.label}</div>
      </div>
    </div>
  );
}

export function MeterBar({ value, color = '#C5FF00' }: { value: number; color?: string }) {
  return (
    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

export function CompetitionLabel({ score }: { score: number }) {
  if (score >= 75) return <span className="text-red-400 text-xs font-semibold">High</span>;
  if (score >= 50) return <span className="text-amber-400 text-xs font-semibold">Medium</span>;
  return <span className="text-emerald-400 text-xs font-semibold">Low</span>;
}

export { getScoreConfig };
