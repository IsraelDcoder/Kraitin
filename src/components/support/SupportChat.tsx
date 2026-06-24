import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MessageCircle, X, Send, Loader2, Bot, Minimize2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi${user?.email ? ` there` : ''}! 👋 I'm Kira, your KRAITIN support assistant. How can I help you today?`,
      }]);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/support-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ conversationId, message: text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setSending(false);
    }
  };

  const sendReport = async () => {
    if (!conversationId || reportSent) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${supabaseUrl}/functions/v1/support-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ conversationId, sendReport: true }),
      });
      setReportSent(true);
      toast.success('Conversation sent to our support team!');
    } catch {
      toast.error('Failed to send report');
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Auto-email transcript whenever user had a real conversation
    const hasUserMsg = messages.some(m => m.role === 'user');
    if (conversationId && hasUserMsg && !reportSent) sendReport();
  };

  if (!user) return null;

  return (
    <>
      {/* Floating chat bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg',
          'flex items-center justify-center transition-all duration-200',
          'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 hover:scale-105',
          open && 'scale-90 opacity-0 pointer-events-none',
        )}
        aria-label="Open support chat"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Chat panel */}
      <div className={cn(
        'fixed bottom-6 right-6 z-50 w-[350px] md:w-[380px] max-h-[560px] flex flex-col',
        'rounded-2xl border border-white/[0.08] bg-[#0a0b0f] shadow-2xl',
        'transition-all duration-300 origin-bottom-right',
        open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none',
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#C5FF00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Kira</p>
            <p className="text-[11px] text-white/35">KRAITIN Support · Usually instant</p>
          </div>
          <div className="flex items-center gap-1">
            {conversationId && !reportSent && (
              <button
                onClick={sendReport}
                className="w-7 h-7 flex items-center justify-center text-white/25 hover:text-white/60 rounded-lg hover:bg-white/[0.05] transition-colors"
                title="Email this conversation to support"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-white/25 hover:text-white/60 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-[#C5FF00]" />
                </div>
              )}
              <div className={cn(
                'max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed text-pretty',
                msg.role === 'assistant'
                  ? 'bg-white/[0.04] border border-white/[0.06] text-white/80'
                  : 'bg-[#C5FF00]/10 border border-[#C5FF00]/15 text-white/90',
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-[#C5FF00]" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] px-3 py-2 rounded-xl flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 text-white/30 animate-spin" />
                <span className="text-xs text-white/30">Kira is typing…</span>
              </div>
            </div>
          )}
          {reportSent && (
            <div className="text-center text-[11px] text-white/30 py-1">
              ✓ Conversation sent to support team
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 pb-3 shrink-0">
          <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Message Kira…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none resize-none min-h-[20px] max-h-[80px] overflow-y-auto"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors mb-0.5',
                input.trim() && !sending
                  ? 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90'
                  : 'bg-white/[0.06] text-white/20 cursor-not-allowed',
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-white/15 text-center mt-1.5">
            Powered by KRAITIN AI · Press ✉ to email transcript
          </p>
        </div>
      </div>
    </>
  );
}
