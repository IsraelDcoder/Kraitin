import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Twitter, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    // Simulate submission delay
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    toast.success("Message sent! We'll get back to you within 24 hours.");
  };

  const contacts = [
    {
      icon: Mail,
      label: 'Email Support',
      value: 'support@kraitin.com',
      sub: 'Response within 24 hours',
      href: 'mailto:support@kraitin.com',
    },
    {
      icon: Twitter,
      label: 'Twitter / X',
      value: '@kraitin_ai',
      sub: 'DMs open for quick questions',
      href: 'https://twitter.com/kraitin_ai',
    },
    {
      icon: MessageSquare,
      label: 'Billing & Accounts',
      value: 'billing@kraitin.com',
      sub: 'Subscription and payment help',
      href: 'mailto:billing@kraitin.com',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-md px-6 md:px-12 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#C5FF00] flex items-center justify-center">
            <span className="text-black font-black text-xs">K</span>
          </div>
          <span className="font-bold text-white/80">kraitin</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Get in Touch</h1>
          <p className="text-white/50 text-lg">We're here to help. Reach out via any channel below.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact channels */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-6">Contact Channels</h2>
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
                  <c.icon className="w-4.5 h-4.5 text-[#C5FF00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40 mb-0.5">{c.label}</p>
                  <p className="font-semibold text-white group-hover:text-[#C5FF00] transition-colors text-sm">{c.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{c.sub}</p>
                </div>
              </a>
            ))}

            <div className="mt-8 p-5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-semibold text-white mb-2 text-sm">Office Hours</h3>
              <p className="text-white/40 text-xs leading-relaxed">Mon – Fri: 9:00 AM – 6:00 PM (UTC)<br />Weekend support available for critical issues.</p>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-6">Send a Message</h2>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-[#C5FF00]/20 bg-[#C5FF00]/[0.03]">
                <div className="w-14 h-14 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/30 flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-[#C5FF00]" />
                </div>
                <h3 className="font-bold text-white text-xl mb-2">Message Sent!</h3>
                <p className="text-white/50 text-sm">We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-6 text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Name <span className="text-[#C5FF00]">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Email <span className="text-[#C5FF00]">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="What's this about?"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Message <span className="text-[#C5FF00]">*</span></label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={6}
                    placeholder="Tell us how we can help..."
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C5FF00]/40 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 mt-16">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#C5FF00] flex items-center justify-center">
            <span className="text-black font-black text-xs">K</span>
          </div>
          <span className="font-bold text-white/80">kraitin</span>
        </div>
        <p className="text-white/30 text-xs">© 2026 Kraitin. The AI Cofounder That Tells You What To Build.</p>
        <div className="flex gap-5 text-xs text-white/40">
          <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-white/70 transition-colors text-white/70">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
