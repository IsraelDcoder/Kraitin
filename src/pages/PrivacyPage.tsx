import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-black mb-3">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-12">Last updated: June 22, 2026</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly to us, including:</p>
            <ul className="space-y-2 pl-4">
              {[
                'Account information (name, email address, password)',
                'Payment information (processed securely by Stripe — we never store card numbers)',
                'Content you submit to the AI agents (startup ideas, research queries)',
                'Usage data and interaction logs within the platform',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#C5FF00] mt-1.5 shrink-0">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="space-y-2 pl-4">
              {[
                'Provide, maintain, and improve the Service',
                'Process transactions and send related information',
                'Generate AI-powered research and analysis reports',
                'Send transactional emails and service updates',
                'Monitor and analyze usage patterns to improve the platform',
                'Detect and prevent fraud or abuse',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#C5FF00] mt-1.5 shrink-0">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase infrastructure with row-level security policies. Payment data is handled exclusively by Stripe and is never stored on our servers. We use industry-standard encryption (TLS) for all data in transit.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. AI-Generated Content</h2>
            <p>Queries you submit to Kraitin's AI agents are processed to generate reports. We may use anonymized, aggregated usage data to improve our AI models. We do not sell your individual query data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Sharing of Information</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="space-y-2 pl-4 mt-3">
              {[
                'Stripe (payment processing)',
                'Supabase (database and authentication infrastructure)',
                'Google (AI search and grounding via API)',
                'Law enforcement when required by law',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#C5FF00] mt-1.5 shrink-0">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Cookies</h2>
            <p>We use essential cookies to maintain your session and authentication state. We do not use third-party advertising cookies. You can control cookie settings through your browser, though disabling essential cookies may impact functionality.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may export your account data from Settings or request deletion by contacting us. Upon account deletion, your personal data will be removed within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. AI-generated reports are retained for 12 months from creation. Billing records are retained for 7 years as required by financial regulations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Children's Privacy</h2>
            <p>The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete the data promptly.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Contact Us</h2>
            <p>For privacy-related questions or data requests, contact us at <a href="mailto:privacy@kraitin.com" className="text-[#C5FF00] hover:underline">privacy@kraitin.com</a> or visit our <Link to="/contact" className="text-[#C5FF00] hover:underline">Contact page</Link>.</p>
          </section>
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
          <Link to="/privacy" className="hover:text-white/70 transition-colors text-white/70">Privacy</Link>
          <Link to="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
