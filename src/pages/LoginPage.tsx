import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// biome-ignore lint/correctness/noUnusedImports: used below
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { KraitinLogo } from '@/components/ui/KraitinLogo';
import { getStoredReferralCode, clearReferralCode } from '@/lib/referral';

/* ── Google logo SVG (inline, no external dep) ── */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── floating particles background ── */
function Particles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    dur: Math.random() * 8 + 6,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.3 + 0.05,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#C5FF00] animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {/* large diffuse glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#C5FF00]/[0.04] blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-[#C5FF00]/[0.03] blur-[100px]" />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithUsername, signUpWithUsername, signInWithGoogle, user, profile, loading: authLoading, profileReady, onboardingCompleted } = useAuth();

  const isRegister = searchParams.get('tab') === 'register';
  const [mode, setMode] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  // Redirect already-authenticated users once profile has settled.
  // We wait for profileReady so we never redirect based on a stale null profile.
  useEffect(() => {
    if (authLoading || !profileReady || !user) return;
    // Gate: email must be verified before entering the app
    if (!user.email_confirmed_at) {
      navigate('/verify-email', { replace: true });
      return;
    }
    if (onboardingCompleted) {
      navigate('/opportunities', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, authLoading, profileReady, onboardingCompleted, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
    // on success the page redirects to /auth/callback — no need to setLoading(false)
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await signInWithUsername(username.trim(), password);
    setLoading(false);
    if (error) { toast.error(error.message || 'Login failed'); return; }
    toast.success('Welcome back!');
    // Routing is handled by the useEffect below once founderProfile loads
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { toast.error('Username: letters, digits, _ only'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!agreed) { toast.error('Please accept the Terms & Privacy Policy'); return; }
    setLoading(true);
    const refCode = getStoredReferralCode();
    const { error } = await signUpWithUsername(username.trim(), email.trim(), password, refCode ?? undefined);
    setLoading(false);
    if (error) { toast.error(error.message || 'Registration failed'); return; }
    if (refCode) clearReferralCode();
    toast.success(`Verification email sent to ${email.trim()} — check your inbox to activate your account.`, { duration: 6000 });
    // The useEffect will redirect to /verify-email once the user session is set
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative overflow-hidden">
      <Particles />

      {/* back to home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Home
      </button>

      {/* glass card */}
      <div
        className="relative z-10 w-full max-w-md transition-all duration-700"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)' }}
      >
        {/* logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <KraitinLogo size="xl" subtitle />
          </div>
          <p className="text-white/40 text-sm mt-1 text-center">The AI Cofounder That Tells You What To Build</p>
        </div>

        {/* card */}
        <div
          className="rounded-2xl border border-white/[0.08] p-8"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)' }}
        >
          {/* Google one-click */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.09] text-white text-sm font-semibold transition-all mb-5 disabled:opacity-50"
          >
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <GoogleIcon className="w-5 h-5 shrink-0" />
            }
            Continue with Google
          </button>

          {/* divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-white/25 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* tab switcher */}
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08] mb-6 bg-white/[0.03]">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-[#C5FF00] text-black'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Username or Email</label>
                <input
                  ref={inputRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username or you@example.com"
                  autoComplete="username"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="text-center mt-3">
                <Link to="/forgot-password" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Username</label>
                <input
                  ref={inputRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="founder_name"
                  autoComplete="username"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                />
                <p className="text-[11px] text-white/25 mt-1">Letters, digits, underscore only</p>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all ${agreed ? 'bg-[#C5FF00] border-[#C5FF00]' : 'border-white/20'}`}
                >
                  {agreed && <span className="text-black text-[10px] font-black">✓</span>}
                </div>
                <span className="text-xs text-white/40 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#C5FF00] hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#C5FF00] hover:underline">Privacy Policy</Link>
                </span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/25 mt-5">
          By continuing you agree to our{' '}
          <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          {' '}·{' '}
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
