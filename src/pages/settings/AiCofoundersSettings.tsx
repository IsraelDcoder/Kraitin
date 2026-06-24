import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, FieldLabel, Divider, RadioCard, ToggleRow, SaveBar } from '@/components/settings/SettingsAtoms';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

export default function AiCofoundersSettings() {
  const { user, profile } = useAuth();
  const [aiMode,         setAiMode]         = useState('Founder Advisor');
  const [responseStyle,  setResponseStyle]  = useState('Balanced');
  const [reportDepth,    setReportDepth]    = useState('Standard Analysis');
  const [recStyle,       setRecStyle]       = useState('Balanced');
  const [autoInsights,   setAutoInsights]   = useState(true);
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const prefs = (profile as any)?.preferences;
    if (prefs?.ai) {
      setAiMode(prefs.ai.aiMode ?? 'Founder Advisor');
      setResponseStyle(prefs.ai.responseStyle ?? 'Balanced');
      setReportDepth(prefs.ai.reportDepth ?? 'Standard Analysis');
      setRecStyle(prefs.ai.recStyle ?? 'Balanced');
      setAutoInsights(prefs.ai.autoInsights ?? true);
    }
  }, [profile]);

  const mark = () => setDirty(true);

  const handleSave = useCallback(async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    setSaving(true);
    const payload = {
      ai: { aiMode, responseStyle, reportDepth, recStyle, autoInsights },
    };
    const { error } = await supabase
      .from('profiles')
      .update({ preferences: payload })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save preferences');
      return;
    }
    toast.success('AI Cofounder preferences saved');
    setDirty(false);
  }, [user, aiMode, responseStyle, reportDepth, recStyle, autoInsights]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">AI Cofounder</h1>
        <p className="text-[13px] text-white/35 mt-1">Customize how your AI Cofounder thinks, advises, and communicates with you.</p>
      </div>

      <Card className="space-y-6">
        <div>
          <FieldLabel>AI Advisor Mode</FieldLabel>
          <p className="text-[11px] text-white/25 mb-3">Choose the perspective your AI Cofounder uses when giving advice</p>
          <RadioCard value={aiMode} onChange={v => { setAiMode(v); mark(); }}
            options={[
              { key: 'Founder Advisor',      label: 'Founder Advisor',      desc: 'Practical, execution-focused advice for building fast.' },
              { key: 'Startup Researcher',   label: 'Startup Researcher',   desc: 'Deep market analysis and data-driven insights.' },
              { key: 'Growth Strategist',    label: 'Growth Strategist',    desc: 'Focuses on user acquisition and viral growth loops.' },
              { key: 'Product Strategist',   label: 'Product Strategist',   desc: 'Product-led thinking, roadmaps, and user experience.' },
              { key: 'YC Partner',           label: 'YC Partner',           desc: 'Large market opportunities and venture-scale outcomes.' },
              { key: 'Investor',             label: 'Investor Lens',        desc: 'Due diligence, cap table, valuation, and funding readiness.' },
              { key: 'Bootstrapped Advisor', label: 'Bootstrapped Advisor', desc: 'Lean, profitable, no-code and low-cost path to revenue.' },
              { key: 'Agency Advisor',       label: 'Agency Advisor',       desc: 'Service-to-product playbook for agency owners.' },
            ]}/>
        </div>
        <Divider />
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <FieldLabel>Response Style</FieldLabel>
            <RadioCard value={responseStyle} onChange={v => { setResponseStyle(v); mark(); }}
              options={['Concise','Balanced','Detailed','Extremely Detailed'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Report Depth</FieldLabel>
            <RadioCard value={reportDepth} onChange={v => { setReportDepth(v); mark(); }}
              options={['Quick Analysis','Standard Analysis','Deep Research','Institutional Grade'].map(k => ({ key: k, label: k }))}/>
          </div>
          <div>
            <FieldLabel>Recommendation Style</FieldLabel>
            <RadioCard value={recStyle} onChange={v => { setRecStyle(v); mark(); }}
              options={['Safe Opportunities','Balanced','High Risk High Reward'].map(k => ({ key: k, label: k }))}/>
          </div>
        </div>
        <Divider />
        <ToggleRow
          label="Auto Insights"
          description="Kraitin automatically generates insights when you view an opportunity."
          value={autoInsights} onChange={v => { setAutoInsights(v); mark(); }}/>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save AI Preferences"/>
    </div>
  );
}
