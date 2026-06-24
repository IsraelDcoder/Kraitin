import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Card, FieldLabel, SaveBar } from '@/components/settings/SettingsAtoms';
import { supabase } from '@/db/supabase';
import { Shield, Smartphone, MonitorSmartphone, Loader2, CheckCircle2 } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface MFAFactor {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string;
}
interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
}

export default function SecuritySettings() {
  /* ── Password change ─────────────────────────────────────────────── */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [dirty,     setDirty]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  /* ── 2FA (TOTP) ──────────────────────────────────────────────────── */
  const [factors,     setFactors]     = useState<MFAFactor[]>([]);
  const [enrolling,   setEnrolling]   = useState(false);
  const [qrUri,       setQrUri]       = useState('');
  const [secret,      setSecret]      = useState('');
  const [factorId,    setFactorId]    = useState('');
  const [verifyCode,  setVerifyCode]  = useState('');
  const [verifying,   setVerifying]   = useState(false);
  const [mfaLoading,  setMfaLoading]  = useState(true);

  /* ── Sessions ────────────────────────────────────────────────────── */
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId,    setRevokingId]    = useState<string | null>(null);

  /* ── Load MFA factors + sessions on mount ───────────────────────── */
  useEffect(() => {
    loadFactors();
    loadSessions();
  }, []);

  async function loadFactors() {
    setMfaLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) setFactors(data.totp ?? []);
    setMfaLoading(false);
  }

  async function loadSessions() {
    setSessionsLoading(true);
    // Use the user's own session list via auth admin — get current session info
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Supabase client exposes the current session; for other sessions we use admin API via edge function
      // For now, show the current session (full session management requires admin API via edge function)
      setSessions([{
        id: session.access_token.slice(-8),
        created_at: session.user.created_at,
        updated_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }]);
    }
    setSessionsLoading(false);
  }

  /* ── 2FA: Start enroll ───────────────────────────────────────────── */
  async function startEnroll() {
    setEnrolling(true);
    setQrUri(''); setSecret(''); setFactorId(''); setVerifyCode('');
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });
    if (error || !data) {
      toast.error('Failed to start 2FA setup: ' + (error?.message ?? 'Unknown error'));
      setEnrolling(false);
      return;
    }
    setQrUri(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  }

  /* ── 2FA: Verify and complete enroll ────────────────────────────── */
  async function verifyEnroll() {
    if (verifyCode.length !== 6) { toast.error('Enter the 6-digit code from your authenticator app'); return; }
    setVerifying(true);
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr || !challengeData) {
      toast.error('Challenge failed: ' + (challengeErr?.message ?? 'Unknown'));
      setVerifying(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });
    if (verifyErr) {
      toast.error('Invalid code. Please try again.');
      setVerifying(false);
      return;
    }
    toast.success('2FA enabled successfully!');
    setEnrolling(false); setQrUri(''); setSecret(''); setFactorId(''); setVerifyCode('');
    await loadFactors();
    setVerifying(false);
  }

  /* ── 2FA: Unenroll ───────────────────────────────────────────────── */
  async function unenroll(id: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { toast.error('Failed to disable 2FA: ' + error.message); return; }
    toast.success('2FA disabled.');
    await loadFactors();
  }

  /* ── Sessions: Sign out all other devices ───────────────────────── */
  async function signOutOtherDevices() {
    setRevokingId('all');
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) { toast.error('Failed: ' + error.message); }
    else { toast.success('Signed out all other devices.'); await loadSessions(); }
    setRevokingId(null);
  }

  /* ── Password save ───────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!newPw || !currentPw) { toast.error('Enter your current and new password'); return; }
    if (newPw.length < 8)     { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw)  { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No authenticated user found');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
      if (signInErr) throw new Error('Current password is incorrect');
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) throw updateErr;
      toast.success('Password updated successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally { setSaving(false); }
  }, [currentPw, newPw, confirmPw]);

  const inputCls = 'bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10';
  const activeFactor = factors.find(f => f.status === 'verified');

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Security</h1>
        <p className="text-[13px] text-white/35 mt-1">Protect your account with strong authentication and session management.</p>
      </div>

      <div className="space-y-4">
        {/* Password */}
        <Card className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Change Password</p>
          <div className="space-y-3">
            {[
              { label: 'Current Password', val: currentPw, set: setCurrentPw },
              { label: 'New Password',     val: newPw,     set: setNewPw },
              { label: 'Confirm Password', val: confirmPw, set: setConfirmPw },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <FieldLabel>{label}</FieldLabel>
                <Input type="password" value={val} onChange={e => { set(e.target.value); setDirty(true); }}
                  placeholder="••••••••••••" className={inputCls}/>
              </div>
            ))}
          </div>
        </Card>

        {/* 2FA */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
              <div>
                <p className="text-[13px] font-medium text-white/75">Two-Factor Authentication</p>
                <p className="text-[11px] text-white/30 mt-0.5">Secure your account with a TOTP authenticator app.</p>
              </div>
            </div>
            {mfaLoading ? (
              <Loader2 className="w-4 h-4 text-white/20 animate-spin shrink-0"/>
            ) : activeFactor ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00]"/>
                <span className="text-[11px] text-[#C5FF00]">Active</span>
                <button onClick={() => unenroll(activeFactor.id)}
                  className="ml-2 h-7 px-3 rounded-lg border border-white/[0.07] text-[11px] text-white/30 hover:border-red-400/30 hover:text-red-400 transition-all">
                  Disable
                </button>
              </div>
            ) : (
              <button onClick={startEnroll}
                className="h-7 px-3 rounded-lg border border-[#C5FF00]/25 text-[11px] text-[#C5FF00] bg-[#C5FF00]/[0.06] hover:bg-[#C5FF00]/10 transition-all shrink-0">
                Enable
              </button>
            )}
          </div>

          {/* Enrollment flow */}
          {enrolling && !activeFactor && (
            <div className="mt-4 space-y-4">
              {qrUri ? (
                <>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[12px] text-white/50 mb-3">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
                    <div className="flex justify-center mb-3">
                      <img src={qrUri} alt="2FA QR Code" className="w-36 h-36 rounded-lg bg-white p-2"/>
                    </div>
                    <p className="text-[11px] text-white/30 text-center">Or enter the secret manually:</p>
                    <p className="text-[11px] font-mono text-white/50 text-center mt-1 break-all">{secret}</p>
                  </div>
                  <div className="flex gap-2">
                    <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code" maxLength={6}
                      className={`${inputCls} flex-1 font-mono tracking-widest`}/>
                    <button onClick={verifyEnroll} disabled={verifying}
                      className="h-10 px-4 rounded-lg bg-[#C5FF00]/90 text-black text-[12px] font-bold hover:bg-[#C5FF00] transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0">
                      {verifying && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                      Verify
                    </button>
                  </div>
                  <button onClick={() => { setEnrolling(false); setQrUri(''); }} className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Cancel</button>
                </>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin"/>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Sessions */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MonitorSmartphone className="w-3.5 h-3.5 text-white/30"/>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Active Sessions</p>
          </div>
          {sessionsLoading ? (
            <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 text-white/20 animate-spin"/></div>
          ) : sessions.length === 0 ? (
            <p className="text-[12px] text-white/20 py-2">No active sessions found.</p>
          ) : (
            <div className="space-y-0">
              {sessions.map((s) => {
                const ua = s.user_agent ?? '';
                const isMobile = /mobile|iphone|android/i.test(ua);
                const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)[/\s][\d.]+/)?.[0] ?? 'Unknown browser';
                const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0]?.trim() ?? 'Unknown OS';
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2.5">
                      {isMobile
                        ? <Smartphone className="w-3.5 h-3.5 text-white/25 shrink-0"/>
                        : <MonitorSmartphone className="w-3.5 h-3.5 text-white/25 shrink-0"/>}
                      <div>
                        <p className="text-[13px] text-white/65 font-medium">{browser}</p>
                        <p className="text-[11px] text-white/25 mt-0.5">{os} · Current session</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#C5FF00] bg-[#C5FF00]/10 border border-[#C5FF00]/20 px-2 py-0.5 rounded-full">Current</span>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={signOutOtherDevices} disabled={revokingId === 'all'}
            className="mt-3 h-8 px-3 rounded-lg border border-white/[0.07] text-[11px] text-white/30 hover:border-red-400/30 hover:text-red-400 transition-all flex items-center gap-1.5 disabled:opacity-40">
            {revokingId === 'all' && <Loader2 className="w-3 h-3 animate-spin"/>}
            Logout All Other Devices
          </button>
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save Security"/>
    </div>
  );
}
