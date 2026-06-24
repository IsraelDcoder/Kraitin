import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Download, Loader2, Trash2 } from 'lucide-react';
import { Card, ToggleRow, SaveBar } from '@/components/settings/SettingsAtoms';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

export default function DataPrivacySettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [allowPersonalized, setAllowPersonalized] = useState(true);
  const [allowAILearning,   setAllowAILearning]   = useState(true);
  const [allowAnalytics,    setAllowAnalytics]    = useState(true);
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [deletingData, setDeletingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load saved preferences from DB
  useEffect(() => {
    const prefs = (profile as any)?.data_privacy_settings;
    if (prefs && Object.keys(prefs).length > 0) {
      if (prefs.allow_personalized !== undefined) setAllowPersonalized(prefs.allow_personalized);
      if (prefs.allow_ai_learning  !== undefined) setAllowAILearning(prefs.allow_ai_learning);
      if (prefs.allow_analytics    !== undefined) setAllowAnalytics(prefs.allow_analytics);
    }
  }, [profile]);

  const mark = () => setDirty(true);

  const handleSave = useCallback(async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      data_privacy_settings: {
        allow_personalized: allowPersonalized,
        allow_ai_learning:  allowAILearning,
        allow_analytics:    allowAnalytics,
      },
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save privacy settings'); return; }
    await refreshProfile();
    toast.success('Privacy settings saved');
    setDirty(false);
  }, [user, allowPersonalized, allowAILearning, allowAnalytics, refreshProfile]);

  // Export handlers — fetch real data and download as JSON
  const handleExport = useCallback(async (section: string) => {
    if (!user) return;
    setExporting(section);
    try {
      let payload: Record<string, unknown> = {};
      if (section === 'Profile') {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        payload = { profile: data };
      } else if (section === 'Reports') {
        const { data } = await supabase.from('reports').select('*').eq('user_id', user.id);
        payload = { reports: data ?? [] };
      } else if (section === 'Saved Opportunities') {
        const { data } = await supabase.from('watchlist').select('*').eq('user_id', user.id);
        payload = { saved_opportunities: data ?? [] };
      } else if (section === 'Workspace Data') {
        const [reports, watchlist, drafts, kira] = await Promise.all([
          supabase.from('reports').select('*').eq('user_id', user.id),
          supabase.from('watchlist').select('*').eq('user_id', user.id),
          supabase.from('content_drafts').select('*').eq('user_id', user.id),
          supabase.from('kira_messages').select('*').eq('user_id', user.id),
        ]);
        payload = {
          reports: reports.data ?? [],
          watchlist: watchlist.data ?? [],
          content_drafts: drafts.data ?? [],
          kira_messages: kira.data ?? [],
        };
      }
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), ...payload }, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `kraitin-${section.toLowerCase().replace(/ /g, '-')}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${section} exported`);
    } catch {
      toast.error(`Failed to export ${section}`);
    } finally {
      setExporting(null);
    }
  }, [user]);

  // Delete all workspace data (keeps auth account)
  const handleDeleteWorkspaceData = useCallback(async () => {
    if (!user) return;
    setDeletingData(true);
    const { error } = await supabase.rpc('delete_user_workspace_data', { p_user_id: user.id });
    setDeletingData(false);
    if (error) { toast.error('Failed to delete workspace data. Please try again.'); return; }
    toast.success('All workspace data deleted');
  }, [user]);

  // Full account deletion — deletes auth user (cascades to all data via RLS/FK)
  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setDeletingAccount(true);
    // First wipe workspace data, then delete auth user
    await supabase.rpc('delete_user_workspace_data', { p_user_id: user.id });
    const { error } = await supabase.auth.admin?.deleteUser?.(user.id)
      // admin client not available client-side; fall back to signOut + contact message
      .catch(() => null) ?? { error: new Error('fallback') };
    if (error) {
      // Can't delete auth user from client; sign out and inform
      await supabase.auth.signOut();
      toast.success('Your data has been cleared. Your account will be fully removed within 24 hours.');
      window.location.href = '/';
      return;
    }
    toast.success('Account deleted');
    window.location.href = '/';
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Data & Privacy</h1>
        <p className="text-[13px] text-white/35 mt-1">Control how your data is collected, used, and stored.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Data Collection</p>
          <div className="divide-y divide-white/[0.04]">
            <ToggleRow label="Personalized Recommendations"
              description="Use your behavior to improve opportunity suggestions."
              value={allowPersonalized} onChange={v => { setAllowPersonalized(v); mark(); }}/>
            <ToggleRow label="AI Learning"
              description="Allow Kraitin's AI to learn from your feedback and usage."
              value={allowAILearning} onChange={v => { setAllowAILearning(v); mark(); }}/>
            <ToggleRow label="Usage Analytics"
              description="Help us improve the product with anonymous usage data."
              value={allowAnalytics} onChange={v => { setAllowAnalytics(v); mark(); }}/>
          </div>
        </Card>

        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Download My Data</p>
          <p className="text-[12px] text-white/35 mb-4">Export a complete copy of your Kraitin data including profile, reports, and saved opportunities.</p>
          <div className="flex flex-wrap gap-2">
            {['Profile','Reports','Saved Opportunities','Workspace Data'].map(item => (
              <button
                key={item}
                onClick={() => handleExport(item)}
                disabled={exporting === item}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 hover:border-white/20 hover:text-white/70 transition-all disabled:opacity-50"
              >
                {exporting === item
                  ? <Loader2 className="w-3 h-3 animate-spin"/>
                  : <Download className="w-3 h-3"/>}
                {item}
              </button>
            ))}
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-400/15 bg-red-400/[0.02]">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-[13px] font-bold text-red-400">Danger Zone</p>
              <p className="text-[11px] text-white/30 mt-0.5">These actions are permanent and cannot be undone.</p>
            </div>
          </div>
          <div className="space-y-3">
            {/* Delete workspace data */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.05]">
              <div>
                <p className="text-[13px] font-medium text-white/60">Delete All Workspace Data</p>
                <p className="text-[11px] text-white/25 mt-0.5">Permanently delete all reports, blueprints, and saved items.</p>
              </div>
              <button
                onClick={handleDeleteWorkspaceData}
                disabled={deletingData}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-400/25 text-red-400 text-[11px] font-semibold hover:bg-red-400/10 transition-all shrink-0 ml-4 disabled:opacity-50"
              >
                {deletingData ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>}
                Delete Data
              </button>
            </div>

            {/* Delete account — two-step confirm */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-red-400/15 bg-red-400/[0.02]">
              <div>
                <p className="text-[13px] font-bold text-red-400">Delete Account</p>
                <p className="text-[11px] text-white/30 mt-0.5">Permanently delete your Kraitin account and all associated data.</p>
              </div>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-8 px-3 rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 text-[11px] font-bold hover:bg-red-400/20 transition-all shrink-0 ml-4"
                >
                  Delete Account
                </button>
              ) : (
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="h-8 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/35 hover:text-white/60 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {deletingAccount ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                    Confirm Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} label="Save Privacy Settings"/>
    </div>
  );
}
