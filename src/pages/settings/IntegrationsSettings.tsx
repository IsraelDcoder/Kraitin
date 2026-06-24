import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, IntegrationRow } from '@/components/settings/SettingsAtoms';

export default function IntegrationsSettings() {
  const { subscription } = useAuth();

  const INTEGRATIONS = [
    { name: 'Stripe',    icon: '🔵', connected: !!subscription?.stripe_customer_id, lastSync: subscription?.stripe_customer_id ? 'Active' : undefined,
      action: <Link to="/billing" className="text-[11px] text-[#C5FF00]/70 hover:text-[#C5FF00] hover:underline">Manage</Link> },
    { name: 'Google',    icon: '🔵', comingSoon: true },
    { name: 'GitHub',    icon: '⚫', comingSoon: true },
    { name: 'LinkedIn',  icon: '🔷', comingSoon: true },
    { name: 'Reddit',    icon: '🟠', comingSoon: true },
    { name: 'Twitter/X', icon: '⬛', comingSoon: true },
    { name: 'Notion',    icon: '⬜', comingSoon: true },
    { name: 'Slack',     icon: '🟣', comingSoon: true },
    { name: 'Discord',   icon: '🟦', comingSoon: true },
    { name: 'OpenAI',    icon: '🟢', comingSoon: true },
    { name: 'Anthropic', icon: '🟡', comingSoon: true },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Integrations</h1>
        <p className="text-[13px] text-white/35 mt-1">Connect your tools and services to extend Kraitin's intelligence.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Connected Accounts</p>
          <div>
            {INTEGRATIONS.map(i => (
              <IntegrationRow
                key={i.name}
                name={i.name}
                icon={i.icon}
                connected={i.connected ?? false}
                lastSync={i.lastSync}
                action={i.action}
                comingSoon={i.comingSoon}
              />
            ))}
          </div>
        </Card>

        <Card className="border-white/[0.04] bg-white/[0.01]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/20 mb-3">Also On The Roadmap</p>
          <div className="flex flex-wrap gap-2">
            {['Linear','Jira','HubSpot','Airtable','Zapier','Make'].map(name => (
              <span
                key={name}
                className="h-7 px-3 rounded-full border border-white/[0.05] text-[11px] text-white/20 flex items-center gap-1.5 select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/15"/>{name}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-white/20 mt-3">Vote for your priority in the <Link to="/contact" className="text-[#C5FF00]/50 hover:text-[#C5FF00] underline">feedback form</Link>.</p>
        </Card>
      </div>
    </div>
  );
}
