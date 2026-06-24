import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Globe, Link, Linkedin, Twitter, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, FieldLabel, Divider, SaveBar } from '@/components/settings/SettingsAtoms';

export default function ProfileSettings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName]   = useState(profile?.full_name || '');
  const [username, setUsername]   = useState(profile?.username || '');
  const [company, setCompany]     = useState('');
  const [role, setRole]           = useState('Founder');
  const [bio, setBio]             = useState('');
  const [location, setLocation]   = useState('');
  const [website, setWebsite]     = useState('');
  const [linkedin, setLinkedin]   = useState('');
  const [twitter, setTwitter]     = useState('');
  const [dirty, setDirty]         = useState(false);
  const [saving, setSaving]       = useState(false);

  const mark = () => setDirty(true);

  const completeness = Math.round(
    [!!fullName, !!username, !!company, !!bio, !!location, !!website, !!linkedin, !!twitter]
      .filter(Boolean).length / 8 * 100
  );

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, username, updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save profile'); return; }
    toast.success('Profile saved');
    setDirty(false);
  }, [user, fullName, username]);

  if (!user) { navigate('/login'); return null; }

  const inputCls = 'bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10';

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Profile</h1>
        <p className="text-[13px] text-white/35 mt-1">Your public identity and professional information.</p>
      </div>

      {/* Completeness */}
      <Card className="border-[#C5FF00]/15 bg-[#C5FF00]/[0.02] mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5FF00]/50 mb-1">Profile Completeness</p>
            <p className="text-xl font-black text-white">{completeness}%</p>
          </div>
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" fill="none"/>
              <circle cx="24" cy="24" r="20" stroke="#C5FF00" strokeWidth="3.5" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - completeness / 100)}`}
                className="transition-all duration-700"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#C5FF00]">{completeness}</span>
          </div>
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full bg-[#C5FF00] rounded-full transition-all duration-700" style={{ width: `${completeness}%` }} />
        </div>
      </Card>

      <Card className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-14 h-14 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center text-xl font-black text-[#C5FF00]">
              {(fullName || profile?.email || 'F')[0].toUpperCase()}
            </div>
            <button className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white"/>
            </button>
          </div>
          <div>
            <p className="text-[13px] font-medium text-white/65">Profile Picture</p>
            <p className="text-[11px] text-white/25 mt-0.5">Recommended: 400×400px</p>
            <button className="text-[11px] text-[#C5FF00]/60 hover:text-[#C5FF00] transition-colors mt-1">Upload photo</button>
          </div>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Full Name</FieldLabel>
            <Input value={fullName} onChange={e => { setFullName(e.target.value); mark(); }}
              placeholder="Your full name" className={inputCls}/>
          </div>
          <div>
            <FieldLabel required>Username</FieldLabel>
            <Input value={username} onChange={e => { setUsername(e.target.value); mark(); }}
              placeholder="your-handle" className={inputCls}/>
          </div>
          <div>
            <FieldLabel>Company</FieldLabel>
            <Input value={company} onChange={e => { setCompany(e.target.value); mark(); }}
              placeholder="Your company" className={inputCls}/>
          </div>
          <div>
            <FieldLabel>Role</FieldLabel>
            <select value={role} onChange={e => { setRole(e.target.value); mark(); }}
              className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/70 text-sm outline-none focus:border-white/20 transition-colors appearance-none">
              {['Founder','Indie Hacker','Developer','Product Manager','Startup Team','Agency Owner','Investor','Student','Other'].map(r => (
                <option key={r} value={r} className="bg-[#0a0b0f]">{r}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Bio</FieldLabel>
            <Textarea value={bio} onChange={e => { setBio(e.target.value); mark(); }}
              placeholder="Tell Kraitin about yourself and what you're building..." rows={3}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 resize-none"/>
          </div>
          <div>
            <FieldLabel>Location</FieldLabel>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none"/>
              <Input value={location} onChange={e => { setLocation(e.target.value); mark(); }}
                placeholder="City, Country" className={`pl-9 ${inputCls}`}/>
            </div>
          </div>
          <div>
            <FieldLabel>Website</FieldLabel>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none"/>
              <Input value={website} onChange={e => { setWebsite(e.target.value); mark(); }}
                placeholder="https://yoursite.com" className={`pl-9 ${inputCls}`}/>
            </div>
          </div>
          <div>
            <FieldLabel>LinkedIn</FieldLabel>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none"/>
              <Input value={linkedin} onChange={e => { setLinkedin(e.target.value); mark(); }}
                placeholder="linkedin.com/in/you" className={`pl-9 ${inputCls}`}/>
            </div>
          </div>
          <div>
            <FieldLabel>Twitter / X</FieldLabel>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none"/>
              <Input value={twitter} onChange={e => { setTwitter(e.target.value); mark(); }}
                placeholder="@yourhandle" className={`pl-9 ${inputCls}`}/>
            </div>
          </div>
        </div>
        <Divider />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/20 mb-3">Authentication Status</p>
          <div className="flex flex-wrap gap-2">
            {[{ label: 'Email Verified', ok: !!user?.email_confirmed_at }, { label: 'Google Connected', ok: false }].map(({ label, ok }) => (
              <div key={label} className={cn('flex items-center gap-1.5 h-7 px-3 rounded-full border text-[11px] font-medium',
                ok ? 'border-[#C5FF00]/20 text-[#C5FF00]/70 bg-[#C5FF00]/[0.04]' : 'border-white/[0.07] text-white/25')}>
                {ok ? <Check className="w-3 h-3 text-[#C5FF00]"/> : <span className="w-1.5 h-1.5 rounded-full bg-white/20"/>}
                {label}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save Profile"/>
    </div>
  );
}
