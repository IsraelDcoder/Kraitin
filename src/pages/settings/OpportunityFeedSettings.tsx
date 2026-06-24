import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Card, FieldLabel, Divider, ChipSelect, RadioCard, SaveBar } from '@/components/settings/SettingsAtoms';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

const CATS = ['AI','Health','Finance','Education','Productivity','Developer Tools','Consumer Apps','Enterprise SaaS','Marketplaces','Gaming','Travel','Legal','Creator Economy'];

export default function OpportunityFeedSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [priorityCats,    setPriorityCats]    = useState<string[]>(['AI', 'Health', 'Finance']);
  const [hideCats,        setHideCats]        = useState<string[]>([]);
  const [scoreThreshold,  setScoreThreshold]  = useState([70]);
  const [compPref,        setCompPref]        = useState('Any');
  const [revenueFilter,   setRevenueFilter]   = useState('Any');
  const [growthFilter,    setGrowthFilter]    = useState('Any');
  const [defaultView,     setDefaultView]     = useState('Opportunities');
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const prefs = (profile as any)?.opportunity_prefs;
    if (prefs && Object.keys(prefs).length > 0) {
      if (prefs.priorityCats)   setPriorityCats(prefs.priorityCats);
      if (prefs.hideCats)       setHideCats(prefs.hideCats);
      if (prefs.scoreThreshold) setScoreThreshold(prefs.scoreThreshold);
      if (prefs.compPref)       setCompPref(prefs.compPref);
      if (prefs.revenueFilter)  setRevenueFilter(prefs.revenueFilter);
      if (prefs.growthFilter)   setGrowthFilter(prefs.growthFilter);
      if (prefs.defaultView)    setDefaultView(prefs.defaultView);
    }
  }, [profile]);

  const mark = () => setDirty(true);

  const handleSave = useCallback(async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    setSaving(true);
    const payload = { priorityCats, hideCats, scoreThreshold, compPref, revenueFilter, growthFilter, defaultView };
    const { error } = await supabase
      .from('profiles')
      .update({ opportunity_prefs: payload })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save feed preferences'); return; }
    await refreshProfile();
    toast.success('Opportunity feed preferences saved');
    setDirty(false);
  }, [user, priorityCats, hideCats, scoreThreshold, compPref, revenueFilter, growthFilter, defaultView, refreshProfile]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Opportunity Feed</h1>
        <p className="text-[13px] text-white/35 mt-1">Control which opportunities appear in your dashboard and how they're ranked.</p>
      </div>

      <Card className="space-y-6">
        <div>
          <FieldLabel>Prioritize Categories</FieldLabel>
          <ChipSelect multi options={CATS} selected={priorityCats} onChange={v => { setPriorityCats(v); mark(); }}/>
        </div>
        <Divider />
        <div>
          <FieldLabel>Hide Categories</FieldLabel>
          <ChipSelect multi options={CATS} selected={hideCats} onChange={v => { setHideCats(v); mark(); }}/>
        </div>
        <Divider />
        <div>
          <div className="flex items-center justify-between mb-3">
            <FieldLabel>Minimum Opportunity Score</FieldLabel>
            <span className="text-sm font-black text-[#C5FF00]">{scoreThreshold[0]}+</span>
          </div>
          <div className="px-1">
            <Slider min={0} max={100} step={5} value={scoreThreshold}
              onValueChange={v => { setScoreThreshold(v); mark(); }}
              className="[&_[data-orientation=horizontal]]:h-1 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-[#C5FF00]/50 [&_[role=slider]]:bg-[#0a0b0f]"/>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[0, 50, 70, 80, 90].map(v => (
              <button key={v} onClick={() => { setScoreThreshold([v]); mark(); }}
                className={cn('h-6 px-2.5 rounded-full border text-[10px] font-medium transition-all',
                  scoreThreshold[0] === v
                    ? 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]'
                    : 'border-white/[0.07] text-white/30 hover:border-white/20')}>
                {v === 0 ? 'Any' : `${v}+`}
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <FieldLabel>Competition</FieldLabel>
            <RadioCard value={compPref} onChange={v => { setCompPref(v); mark(); }}
              options={['Low','Medium','High','Any'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Revenue Filter</FieldLabel>
            <RadioCard value={revenueFilter} onChange={v => { setRevenueFilter(v); mark(); }}
              options={['Any','<$10K MRR','$10K–$100K','$100K–$1M','$1M–$10M','$10M+'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Min. Growth</FieldLabel>
            <RadioCard value={growthFilter} onChange={v => { setGrowthFilter(v); mark(); }}
              options={['Any','+10%','+25%','+50%','+100%'].map(k => ({ key: k, label: k }))}/>
          </div>
        </div>
        <Divider />
        <div>
          <FieldLabel>Default Dashboard View</FieldLabel>
          <RadioCard value={defaultView} onChange={v => { setDefaultView(v); mark(); }}
            options={['Opportunities','Trending','Hidden Gems','Watchlist','Workspace'].map(k => ({ key: k, label: k }))}/>
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save Feed Settings"/>
    </div>
  );
}
