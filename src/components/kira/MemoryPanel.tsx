import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Pencil, X, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────
interface KiraMemory {
  current_idea:  string;
  stage:         string;
  tech_stack:    string[];
  target_market: string;
  goals:         string;
  notes:         string;
}

const STAGE_OPTIONS = [
  { value: 'idea',     label: 'Exploring ideas',   color: 'text-white/40' },
  { value: 'building', label: 'Building MVP',       color: 'text-yellow-400/70' },
  { value: 'launched', label: 'Launched',           color: 'text-[#C5FF00]/70' },
  { value: 'growing',  label: 'Growing / scaling',  color: 'text-blue-400/70' },
];

const EMPTY: KiraMemory = {
  current_idea:  '',
  stage:         '',
  tech_stack:    [],
  target_market: '',
  goals:         '',
  notes:         '',
};

export function MemoryPanel() {
  const { user } = useAuth();
  const [memory, setMemory]         = useState<KiraMemory>(EMPTY);
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState<KiraMemory>(EMPTY);
  const [expanded, setExpanded]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [stackInput, setStackInput] = useState('');
  const hasAnyMemory = Object.entries(memory).some(([k, v]) =>
    k !== 'tech_stack' ? !!v : (v as string[]).length > 0
  );

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('kira_memory')
      .select('current_idea,stage,tech_stack,target_market,goals,notes')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setMemory({
        current_idea:  data.current_idea  ?? '',
        stage:         data.stage         ?? '',
        tech_stack:    data.tech_stack    ?? [],
        target_market: data.target_market ?? '',
        goals:         data.goals         ?? '',
        notes:         data.notes         ?? '',
      });
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => {
    setDraft({ ...memory });
    setStackInput('');
    setEditing(true);
    setExpanded(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(EMPTY);
    setStackInput('');
  };

  const addTech = () => {
    const t = stackInput.trim();
    if (!t || draft.tech_stack.includes(t)) return;
    setDraft(d => ({ ...d, tech_stack: [...d.tech_stack, t] }));
    setStackInput('');
  };

  const removeTech = (tech: string) =>
    setDraft(d => ({ ...d, tech_stack: d.tech_stack.filter(t => t !== tech) }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id:       user.id,
      current_idea:  draft.current_idea  || null,
      stage:         draft.stage         || null,
      tech_stack:    draft.tech_stack.length ? draft.tech_stack : null,
      target_market: draft.target_market || null,
      goals:         draft.goals         || null,
      notes:         draft.notes         || null,
      updated_at:    new Date().toISOString(),
    };
    const { error } = await supabase
      .from('kira_memory')
      .upsert(payload, { onConflict: 'user_id' });
    setSaving(false);
    if (error) { toast.error('Failed to save memory'); return; }
    setMemory({ ...draft });
    setEditing(false);
    toast.success('Kira will remember this');
  };

  const stageMeta = STAGE_OPTIONS.find(s => s.value === memory.stage);

  return (
    <div className="border-t border-white/[0.05]">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.02] transition-colors group"
      >
        <Brain className={cn('w-3.5 h-3.5 shrink-0 transition-colors', hasAnyMemory ? 'text-[#C5FF00]/60' : 'text-white/20')} />
        <span className="flex-1 text-left text-[11px] text-white/35 font-medium">
          {hasAnyMemory ? 'Kira remembers you' : 'Memory'}
        </span>
        {hasAnyMemory && !editing && (
          <button
            onClick={e => { e.stopPropagation(); startEdit(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-white/20 hover:text-white/50 transition-all"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {expanded
          ? <ChevronUp  className="w-3 h-3 text-white/20 shrink-0" />
          : <ChevronDown className="w-3 h-3 text-white/20 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {!editing ? (
            /* ── Read view ── */
            <div className="space-y-2">
              {!hasAnyMemory ? (
                <div className="py-3 text-center">
                  <p className="text-[11px] text-white/20 mb-2.5">Tell Kira about yourself so she can personalise every answer.</p>
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 mx-auto text-[11px] text-[#C5FF00]/60 hover:text-[#C5FF00]/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Set up memory
                  </button>
                </div>
              ) : (
                <>
                  {memory.current_idea && (
                    <MemoryRow label="Building" value={memory.current_idea} />
                  )}
                  {memory.stage && stageMeta && (
                    <MemoryRow label="Stage" value={stageMeta.label} valueClass={stageMeta.color} />
                  )}
                  {memory.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.tech_stack.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-white/35">{t}</span>
                      ))}
                    </div>
                  )}
                  {memory.target_market && (
                    <MemoryRow label="Market" value={memory.target_market} />
                  )}
                  {memory.goals && (
                    <MemoryRow label="Goal" value={memory.goals} />
                  )}
                  {memory.notes && (
                    <MemoryRow label="Notes" value={memory.notes} />
                  )}
                  <button
                    onClick={startEdit}
                    className="mt-2 text-[10px] text-white/20 hover:text-white/50 transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-2.5 h-2.5" /> Edit memory
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Edit view ── */
            <div className="space-y-3">
              <MemoryField
                label="What are you building?"
                placeholder="e.g. AI meal planner for fitness apps"
                value={draft.current_idea}
                onChange={v => setDraft(d => ({ ...d, current_idea: v }))}
              />

              {/* Stage picker */}
              <div>
                <p className="text-[10px] text-white/30 mb-1.5 font-medium uppercase tracking-wide">Stage</p>
                <div className="grid grid-cols-2 gap-1">
                  {STAGE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDraft(d => ({ ...d, stage: d.stage === opt.value ? '' : opt.value }))}
                      className={cn(
                        'text-[10px] px-2 py-1.5 rounded-lg border text-left transition-all',
                        draft.stage === opt.value
                          ? 'border-[#C5FF00]/25 bg-[#C5FF00]/[0.06] text-[#C5FF00]/80'
                          : 'border-white/[0.07] text-white/30 hover:border-white/15'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech stack */}
              <div>
                <p className="text-[10px] text-white/30 mb-1.5 font-medium uppercase tracking-wide">Tech stack</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {draft.tech_stack.map(t => (
                    <span key={t} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/45">
                      {t}
                      <button onClick={() => removeTech(t)} className="text-white/25 hover:text-red-400 transition-colors"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={stackInput}
                    onChange={e => setStackInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                    placeholder="e.g. React, Supabase"
                    className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-2 py-1 text-[11px] text-white/60 placeholder:text-white/15 outline-none focus:border-white/15"
                  />
                  <button onClick={addTech} className="px-2 py-1 rounded-lg border border-white/[0.07] text-white/30 hover:text-white/60 text-[11px] transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <MemoryField
                label="Target market"
                placeholder="e.g. B2B SaaS, fitness enthusiasts"
                value={draft.target_market}
                onChange={v => setDraft(d => ({ ...d, target_market: v }))}
              />
              <MemoryField
                label="Goals"
                placeholder="e.g. reach $10K MRR, raise pre-seed"
                value={draft.goals}
                onChange={v => setDraft(d => ({ ...d, goals: v }))}
              />
              <MemoryField
                label="Anything else Kira should know"
                placeholder="e.g. solo founder, 3 months in, non-technical"
                value={draft.notes}
                onChange={v => setDraft(d => ({ ...d, notes: v }))}
              />

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-[#C5FF00]/80 text-[11px] font-semibold hover:bg-[#C5FF00]/15 transition-all disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/30 text-[11px] hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────
function MemoryRow({ label, value, valueClass = 'text-white/50' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px]">
      <span className="text-white/20 shrink-0 w-12">{label}</span>
      <span className={cn('flex-1 min-w-0 truncate', valueClass)}>{value}</span>
    </div>
  );
}

function MemoryField({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] text-white/30 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-2 py-1.5 text-[11px] text-white/60 placeholder:text-white/15 outline-none focus:border-white/15 transition-colors"
      />
    </div>
  );
}
