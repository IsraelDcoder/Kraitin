import { useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#080a0e] p-6 text-center">
      {/* Glow orb */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#C5FF00]/[0.03] blur-[120px] pointer-events-none" />

      {/* 404 number */}
      <p className="text-[120px] md:text-[160px] font-black leading-none tabular-nums text-balance"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        404
      </p>

      <h1 className="text-lg md:text-xl font-bold text-white/80 mt-2 text-balance">
        This page doesn't exist
      </h1>
      <p className="text-sm text-white/30 mt-2 max-w-xs text-pretty">
        The URL may be wrong, or this page was moved. Head back to a safe place.
      </p>

      {/* Quick nav */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </button>
        <button
          onClick={() => navigate('/opportunities')}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          <Compass className="w-3.5 h-3.5" /> Opportunities
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-sm text-[#C5FF00] hover:bg-[#C5FF00]/15 transition-all"
        >
          <Home className="w-3.5 h-3.5" /> Home
        </button>
      </div>

      <p className="absolute bottom-6 text-xs text-white/15">
        &copy; {new Date().getFullYear()} Kraitin
      </p>
    </div>
  );
}
