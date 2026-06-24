import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { cn } from '@/lib/utils';
import {
  Send, StopCircle, Plus, Bot, Sparkles, Trash2,
  Copy, Check, TrendingUp, Target, DollarSign, Rocket, Users, BarChart3,
} from 'lucide-react';
import { createParser } from 'eventsource-parser';
import { Streamdown } from 'streamdown';
import { toast } from 'sonner';
import { MemoryPanel } from '@/components/kira/MemoryPanel';

// ── Types ────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

// ── Suggestion categories ────────────────────────────────────────────
const SUGGESTION_CATEGORIES = [
  {
    icon: Target,
    label: 'Idea Evaluation',
    prompts: [
      'Should I build an AI dating app?',
      'Is there still an opportunity in note-taking apps?',
      'Should I build a B2B SaaS for restaurant inventory management?',
    ],
  },
  {
    icon: TrendingUp,
    label: 'Market Research',
    prompts: [
      'What startup ideas are exploding right now in 2026?',
      'Analyze the AI productivity tools market',
      'What are the fastest-growing B2B SaaS categories this year?',
    ],
  },
  {
    icon: DollarSign,
    label: 'Monetization',
    prompts: [
      'Best monetization model for a consumer mobile app?',
      'Should I charge per seat or per usage for my SaaS?',
      'How do I price my first SaaS product?',
    ],
  },
  {
    icon: Users,
    label: 'Growth & GTM',
    prompts: [
      'How do I find my first 100 customers?',
      'What are the best acquisition channels for a B2B tool?',
      'How do I get users without a marketing budget?',
    ],
  },
  {
    icon: BarChart3,
    label: 'Validation',
    prompts: [
      'How do I validate my SaaS idea in 2 weeks without building anything?',
      'What are the fastest ways to test product-market fit?',
      'How do I know if people will actually pay for my idea?',
    ],
  },
  {
    icon: Rocket,
    label: 'Launch Strategy',
    prompts: [
      'Give me a 30-day launch plan for a new SaaS product',
      'How do I launch on Product Hunt successfully?',
      'What should I do the week before my app launches?',
    ],
  },
];

// ── Timestamp helper ─────────────────────────────────────────────────
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Copy button for messages ─────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-white/60 transition-all"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-[#C5FF00]" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function KiraPage() {
  const { user } = useAuth();
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState('');
  const [streaming, setStreaming]           = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs]     = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);
  const abortRef    = useRef<AbortController | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    const { data } = await supabase
      .from('kira_conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(40);
    setConversations(data ?? []);
    setLoadingConvs(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load a conversation's messages
  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from('kira_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
      setConversationId(convId);
    }
  };

  // New chat
  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Delete conversation
  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('kira_conversations').delete().eq('id', convId);
    if (conversationId === convId) newChat();
    setConversations(prev => prev.filter(c => c.id !== convId));
    toast.success('Conversation deleted');
  };

  // Send message — no history sent; server loads from DB
  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput('');

    const userMsg: Message     = { id: crypto.randomUUID(), role: 'user', content: msg };
    const assistantId          = crypto.randomUUID();
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', streaming: true }]);
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // No history field — server loads authoritative history from DB
      const res = await fetch(`${supabaseUrl}/functions/v1/kira-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnon,
        },
        body: JSON.stringify({ conversationId, message: msg }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const newConvId = res.headers.get('X-Conversation-Id');
      if (newConvId && !conversationId) {
        setConversationId(newConvId);
        setTimeout(() => loadConversations(), 600);
      }

      // Parse SSE stream
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      const parser  = createParser({
        onEvent: (event) => {
          if (!event.data || event.data === '[DONE]') return;
          try {
            const frame = JSON.parse(event.data);
            const chunk: string = frame?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (chunk) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m
              ));
            }
          } catch { /* skip partial frames */ }
        },
      });

      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) parser.feed(line + '\n');
      }

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "I'm having trouble connecting right now. Please try again.", streaming: false }
            : m
        ));
        toast.error('Kira is unavailable right now. Try again in a moment.');
      }
    } finally {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, streaming: false } : m
      ));
      setStreaming(false);
      setTimeout(() => loadConversations(), 1200);
    }
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
  };

  const isEmpty = messages.length === 0;
  const currentConvTitle = conversations.find(c => c.id === conversationId)?.title;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden">

        {/* ── Conversation Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-white/[0.05] bg-[#06070a]">
          <div className="p-3 border-b border-white/[0.05]">
            <button
              onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#C5FF00]/[0.07] border border-[#C5FF00]/15 text-[#C5FF00]/80 text-xs font-semibold hover:bg-[#C5FF00]/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {loadingConvs ? (
              <div className="px-3 py-2 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-[11px] text-white/20 text-center px-4 py-8">No conversations yet.<br />Ask Kira anything.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 group flex items-start gap-2 hover:bg-white/[0.03] transition-colors',
                    conversationId === conv.id && 'bg-white/[0.04]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/55 truncate leading-snug">{conv.title ?? 'New conversation'}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{relativeTime(conv.updated_at)}</p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0 mt-0.5 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))
            )}
          </div>
          {/* ── Memory panel pinned to bottom of sidebar ── */}
          <MemoryPanel />
        </aside>
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/[0.05]">
            <div className="w-8 h-8 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#C5FF00]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">Kira</p>
                <span className="text-[10px] text-white/20">·</span>
                <span className="text-[10px] text-white/30 truncate max-w-[200px]">
                  {currentConvTitle ?? 'AI Startup Advisor'}
                </span>
              </div>
              <p className="text-[10px] text-white/25">Gemini 2.5 Flash · Deep analysis mode on complex questions</p>
            </div>
            {conversationId && (
              <button onClick={newChat} className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/60 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isEmpty ? (
              /* ── Welcome screen ── */
              <div className="flex flex-col items-start justify-start h-full px-4 md:px-8 py-8 max-w-3xl mx-auto w-full">
                {/* Kira intro */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#C5FF00]/[0.08] border border-[#C5FF00]/15 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#C5FF00]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Hey, I'm Kira.</h2>
                    <p className="text-[13px] text-white/40">Your AI startup advisor. Ask me anything.</p>
                  </div>
                </div>

                <p className="text-[13px] text-white/35 leading-relaxed mb-8 max-w-lg">
                  I give direct answers, not generic advice. Tell me your idea, your market, your problem — I'll tell you the truth about whether it's worth building, and exactly what to do next.
                </p>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {SUGGESTION_CATEGORIES.map((cat, i) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => setActiveCategory(i)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                          activeCategory === i
                            ? 'bg-[#C5FF00]/10 border border-[#C5FF00]/25 text-[#C5FF00]/80'
                            : 'border border-white/[0.07] text-white/30 hover:text-white/50 hover:border-white/15'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Suggestion prompts */}
                <div className="flex flex-col gap-2 w-full max-w-lg">
                  {SUGGESTION_CATEGORIES[activeCategory].prompts.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03] text-left text-[13px] text-white/50 hover:text-white/75 transition-all group"
                    >
                      <span className="text-[#C5FF00]/30 group-hover:text-[#C5FF00]/60 transition-colors shrink-0 text-base leading-none">→</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Message list ── */
              <div className="px-4 md:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn('flex gap-3 group', msg.role === 'user' && 'flex-row-reverse')}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-[#C5FF00]" />
                      </div>
                    )}
                    <div className={cn('flex-1 min-w-0', msg.role === 'user' && 'flex justify-end')}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-[#C5FF00]/[0.07] border border-[#C5FF00]/10 text-sm text-white/85 leading-relaxed">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="prose-kira text-sm text-white/80 leading-relaxed">
                            {msg.streaming && !msg.content ? (
                              /* Thinking indicator */
                              <div className="flex items-center gap-3 text-white/25 py-1">
                                <span className="text-[11px]">Kira is thinking</span>
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/40 animate-bounce [animation-delay:0ms]" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/40 animate-bounce [animation-delay:120ms]" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/40 animate-bounce [animation-delay:240ms]" />
                                </span>
                              </div>
                            ) : (
                              <Streamdown parseIncompleteMarkdown isAnimating={!!msg.streaming}>
                                {msg.content}
                              </Streamdown>
                            )}
                          </div>
                          {!msg.streaming && msg.content && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <CopyButton text={msg.content} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 md:px-6 pb-4 md:pb-6 pt-3 max-w-3xl mx-auto w-full">
            <div className="flex items-end gap-2 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-white/15 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Ask Kira anything — ideas, markets, competitors, monetization…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none resize-none min-h-[22px] max-h-[160px] overflow-y-auto leading-relaxed"
                style={{ scrollbarWidth: 'thin' }}
              />
              {streaming ? (
                <button
                  onClick={stopStream}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors mb-0.5"
                  title="Stop"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5',
                    input.trim()
                      ? 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90'
                      : 'bg-white/[0.05] text-white/15 cursor-not-allowed',
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-white/15 text-center mt-2">
              Deep analysis auto-enabled for idea evaluations · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
