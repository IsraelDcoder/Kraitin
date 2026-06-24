import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, FieldLabel, Divider, ChipSelect, RadioCard, SaveBar } from '@/components/settings/SettingsAtoms';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

export default function FounderPreferencesSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [startupTypes, setStartupTypes] = useState<string[]>(['AI Apps', 'B2B SaaS']);
  const [revenueGoal,  setRevenueGoal]  = useState('$100K MRR');
  const [founderType,  setFounderType]  = useState('Solo Founder');
  const [techExp,      setTechExp]      = useState('Intermediate');
  const [budget,       setBudget]       = useState('$500-$5,000');
  const [timeAvail,    setTimeAvail]    = useState('Part Time');
  const [goals,        setGoals]        = useState<string[]>(['Build Startup', 'Launch SaaS']);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const prefs = (profile as any)?.founder_prefs;
    if (prefs && Object.keys(prefs).length > 0) {
      if (prefs.startupTypes) setStartupTypes(prefs.startupTypes);
      if (prefs.revenueGoal)  setRevenueGoal(prefs.revenueGoal);
      if (prefs.founderType)  setFounderType(prefs.founderType);
      if (prefs.techExp)      setTechExp(prefs.techExp);
      if (prefs.budget)       setBudget(prefs.budget);
      if (prefs.timeAvail)    setTimeAvail(prefs.timeAvail);
      if (prefs.goals)        setGoals(prefs.goals);
    }
  }, [profile]);

  const mark = () => setDirty(true);

  const handleSave = useCallback(async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    setSaving(true);
    const payload = { startupTypes, revenueGoal, founderType, techExp, budget, timeAvail, goals };
    const { error } = await supabase
      .from('profiles')
      .update({ founder_prefs: payload })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save preferences'); return; }
    await refreshProfile();
    toast.success('Founder preferences saved');
    setDirty(false);
  }, [user, startupTypes, revenueGoal, founderType, techExp, budget, timeAvail, goals, refreshProfile]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Founder Preferences</h1>
        <p className="text-[13px] text-white/35 mt-1">Tell Kraitin what you're building so it can personalize every recommendation.</p>
      </div>

      <Card className="space-y-6">
        <div>
          <FieldLabel>Preferred Startup Types</FieldLabel>
          <p className="text-[11px] text-white/25 mb-3">Select all categories you want Kraitin to focus on</p>
          <ChipSelect multi
            options={['AI Apps','Mobile Apps','B2B SaaS','B2C Apps','Marketplaces','Developer Tools','Chrome Extensions','Productivity','HealthTech','FinTech','EdTech','LegalTech','Creator Economy','AI Agents','Enterprise Software','Consumer Social','Gaming','Ecommerce','Travel','Real Estate']}
            selected={startupTypes} onChange={v => { setStartupTypes(v); mark(); }}/>
        </div>
        <Divider />
        <div>
          <FieldLabel>Revenue Goal</FieldLabel>
          <RadioCard value={revenueGoal} onChange={v => { setRevenueGoal(v); mark(); }}
            options={['$1K MRR','$10K MRR','$100K MRR','$1M MRR','$10M+ MRR'].map(k => ({ key: k, label: k }))}/>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <FieldLabel>Founder Type</FieldLabel>
            <RadioCard value={founderType} onChange={v => { setFounderType(v); mark(); }}
              options={['Solo Founder','Technical Founder','Non-Technical Founder','Startup Team','Agency','Investor'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Technical Experience</FieldLabel>
            <RadioCard value={techExp} onChange={v => { setTechExp(v); mark(); }}
              options={['Beginner','Intermediate','Advanced','Expert'].map(k => ({ key: k, label: k }))}/>
          </div>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <FieldLabel>Available Budget</FieldLabel>
            <RadioCard value={budget} onChange={v => { setBudget(v); mark(); }}
              options={['$0-$500','$500-$5,000','$5,000-$25,000','$25,000-$100,000','$100,000+'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Time Available</FieldLabel>
            <RadioCard value={timeAvail} onChange={v => { setTimeAvail(v); mark(); }}
              options={['Weekends Only','Part Time','Full Time','Dedicated Team'].map(k => ({ key: k, label: k }))}/>
          </div>
        </div>
        <Divider />
        <div>
          <FieldLabel>Goals</FieldLabel>
          <ChipSelect multi
            options={['Build Side Income','Quit My Job','Build Startup','Raise Funding','Acquire Users','Sell Business','Launch SaaS','Launch Mobile App']}
            selected={goals} onChange={v => { setGoals(v); mark(); }}/>
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save Preferences"/>
    </div>
  );
}
