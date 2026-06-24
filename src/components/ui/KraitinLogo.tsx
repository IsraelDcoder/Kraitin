const ICON_URL = 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_4b3db498-7c5a-443c-b3f8-7f494160f895.png';

const sizes = {
  xs:  { icon: 'w-5 h-5',  text: 'text-sm',  sub: 'text-[9px]',  gap: 'gap-1.5' },
  sm:  { icon: 'w-6 h-6',  text: 'text-sm',  sub: 'text-[9px]',  gap: 'gap-2'   },
  md:  { icon: 'w-7 h-7',  text: 'text-base', sub: 'text-[10px]', gap: 'gap-2.5' },
  lg:  { icon: 'w-8 h-8',  text: 'text-lg',  sub: 'text-[10px]', gap: 'gap-3'   },
  xl:  { icon: 'w-10 h-10', text: 'text-xl',  sub: 'text-xs',    gap: 'gap-3'   },
};

interface KraitinLogoProps {
  /** 'full' = icon + wordmark (default), 'icon' = icon only */
  variant?: 'full' | 'icon';
  size?: keyof typeof sizes;
  /** Show the 'AI Cofounder' subtitle line */
  subtitle?: boolean;
  className?: string;
}

export function KraitinLogo({
  variant = 'full',
  size = 'md',
  subtitle = false,
  className = '',
}: KraitinLogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Icon mark */}
      <div className={`${s.icon} rounded-lg overflow-hidden shrink-0 ring-1 ring-[#C5FF00]/25`}>
        <img
          src={ICON_URL}
          alt="Kraitin logo"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Wordmark */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-widest text-white uppercase ${s.text}`}>
            kraitin
          </span>
          {subtitle && (
            <span className={`${s.sub} text-white/30 tracking-wide mt-0.5`}>
              AI Cofounder
            </span>
          )}
        </div>
      )}
    </div>
  );
}
