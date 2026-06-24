import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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

        <h1 className="text-4xl md:text-5xl font-black mb-3">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-12">Last updated: June 22, 2026</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Kraitin ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms apply to all visitors, users, and others who access or use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>Kraitin is an AI-powered platform that helps founders and product builders discover startup opportunities, validate ideas, research competitors, plan MVPs, and generate launch strategies. The Service is provided on a subscription basis.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Accounts and Registration</h2>
            <p>You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Free Plan and Subscription</h2>
            <p>New accounts automatically receive a Free Plan with access to the opportunity database. To unlock AI agents and workspace tools, a Pro subscription ($49/month) is required. Your subscription renews monthly until cancelled.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Cancellation and Refunds</h2>
            <p>You may cancel your subscription at any time from your Billing settings. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial billing periods.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Acceptable Use</h2>
            <p>You agree not to misuse the Service. Prohibited activities include: scraping or data mining the platform, reverse engineering the AI models, using the Service for illegal purposes, or attempting to disrupt the Service's infrastructure. Violation may result in immediate account termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are owned by Kraitin and are protected by international copyright, trademark, and other intellectual property laws. AI-generated reports and analyses delivered to you may be used for your own business purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. Kraitin does not warrant that the Service will be uninterrupted, error-free, or that the AI-generated content is accurate, complete, or suitable for any particular purpose. Market insights are informational only and not financial advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Kraitin shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising out of your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the Service after changes constitute acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:legal@kraitin.com" className="text-[#C5FF00] hover:underline">legal@kraitin.com</a> or visit our <Link to="/contact" className="text-[#C5FF00] hover:underline">Contact page</Link>.</p>
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
          <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white/70 transition-colors text-white/70">Terms</Link>
          <Link to="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
