import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, FieldLabel, ToggleRow, RadioCard, SaveBar } from '@/components/settings/SettingsAtoms';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

type NotifKeys = 'newOpps' | 'competitorAlerts' | 'weeklyReports' | 'marketTrends' | 'researchDone' | 'launchReady' | 'productUpdates' | 'billingUpdates' | 'affiliateEarnings';
type NotifState = Record<NotifKeys, boolean>;

const LABELS: Record<NotifKeys, string> = {
  newOpps: 'New Opportunities', competitorAlerts: 'Competitor Alerts',
  weeklyReports: 'Weekly Reports', marketTrends: 'Market Trend Alerts',
  researchDone: 'Research Completed', launchReady: 'Launch Strategy Ready',
  productUpdates: 'Product Updates', billingUpdates: 'Billing Updates',
  affiliateEarnings: 'Affiliate Earnings',
};

const DEFAULT_EMAIL: NotifState = {
  newOpps: true, competitorAlerts: true, weeklyReports: false,
  marketTrends: true, researchDone: true, launchReady: false,
  productUpdates: true, billingUpdates: true, affiliateEarnings: false,
};
const DEFAULT_INAPP: NotifState = {
  newOpps: true, competitorAlerts: true, weeklyReports: true,
  marketTrends: true, researchDone: true, launchReady: true,
  productUpdates: false, billingUpdates: true, affiliateEarnings: true,
};

function loadState(raw: any): NotifState {
  if (!raw || typeof raw !== 'object') return DEFAULT_EMAIL;
  const out = { ...DEFAULT_EMAIL };
  (Object.keys(DEFAULT_EMAIL) as NotifKeys[]).forEach((k) => {
    if (typeof raw[k] === 'boolean') out[k] = raw[k];
  });
  return out;
}

export default function NotificationsSettings() {
  const { user, profile } = useAuth();
  const [email,     setEmail]     = useState<NotifState>(DEFAULT_EMAIL);
  const [inApp,     setInApp]     = useState<NotifState>(DEFAULT_INAPP);
  const [freq,      setFreq]      = useState('Daily Digest');
  const [dirty,     setDirty]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const prefs = (profile as any)?.notification_preferences;
    if (prefs) {
      setEmail(loadState(prefs.email));
      setInApp(loadState(prefs.inApp));
      if (prefs.freq) setFreq(prefs.freq);
    }
  }, [profile]);

  const mark = () => setDirty(true);

  const handleSave = useCallback(async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    setSaving(true);
    const payload = { email, inApp, freq };
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: payload })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save preferences');
      return;
    }
    toast.success('Notification preferences saved');
    setDirty(false);
  }, [user, email, inApp, freq]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Notifications</h1>
        <p className="text-[13px] text-white/35 mt-1">Control how and when Kraitin alerts you to new opportunities and reports.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Email Notifications</p>
          <div className="divide-y divide-white/[0.04]">
            {(Object.entries(email) as [NotifKeys, boolean][]).map(([key, val]) => (
              <ToggleRow key={key} label={LABELS[key]} value={val}
                onChange={v => { setEmail(p => ({ ...p, [key]: v })); mark(); }}/>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">In-App Notifications</p>
          <div className="divide-y divide-white/[0.04]">
            {(Object.entries(inApp) as [NotifKeys, boolean][]).map(([key, val]) => (
              <ToggleRow key={key} label={LABELS[key]} value={val}
                onChange={v => { setInApp(p => ({ ...p, [key]: v })); mark(); }}/>
            ))}
          </div>
        </Card>

        <Card>
          <FieldLabel>Notification Frequency</FieldLabel>
          <RadioCard value={freq} onChange={v => { setFreq(v); mark(); }}
            options={['Instant','Daily Digest','Weekly Digest','Off'].map(k => ({ key: k, label: k }))}/>
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save Notifications"/>
    </div>
  );
}
