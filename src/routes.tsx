import React, { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { RequireSubscription } from '@/components/RequireSubscription';
import { RequireEmailVerified } from '@/components/RequireEmailVerified';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DashboardHomePage = lazy(() => import('./pages/DashboardHomePage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const ResearchAgentPage = lazy(() => import('./pages/ResearchAgentPage'));
const ValidationAgentPage = lazy(() => import('./pages/ValidationAgentPage'));

const MvpPlannerPage = lazy(() => import('./pages/MvpPlannerPage'));
const LaunchAgentPage = lazy(() => import('./pages/LaunchAgentPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const AffiliatePage = lazy(() => import('./pages/AffiliatePage'));
const AffiliateDashboardPage = lazy(() => import('./pages/AffiliateDashboardPage'));
const ReferralRedirectPage   = lazy(() => import('./pages/ReferralRedirectPage'));
const AdminAffiliatesPage    = lazy(() => import('./pages/admin/AdminAffiliatesPage'));
const OpportunityIntelligencePage = lazy(() => import('./pages/OpportunityIntelligencePage'));
const ReportViewerPage = lazy(() => import('./pages/ReportViewerPage'));
const BlueprintAgentPage = lazy(() => import('./pages/BlueprintAgentPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const ContentGeneratorPage = lazy(() => import('./pages/ContentGeneratorPage'));
const KiraPage = lazy(() => import('./pages/KiraPage'));
const StartupTeardownPage = lazy(() => import('./pages/StartupTeardownPage'));
const CompetitorsPage = lazy(() => import('./pages/CompetitorsPage'));
const CompetitorIntelligencePage = lazy(() => import('./pages/CompetitorIntelligencePage'));

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const DocsPage           = lazy(() => import('./pages/DocsPage'));
const BlogIndexPage      = lazy(() => import('./pages/BlogIndexPage'));
const BlogPostPage       = lazy(() => import('./pages/BlogPostPage'));
const SettingsLayout = lazy(() => import('./components/settings/SettingsLayout').then(m => ({ default: m.SettingsLayout })));
const ProfileSettings             = lazy(() => import('./pages/settings/ProfileSettings'));
const FounderPreferencesSettings  = lazy(() => import('./pages/settings/FounderPreferencesSettings'));
const AiCofoundersSettings        = lazy(() => import('./pages/settings/AiCofoundersSettings'));
const OpportunityFeedSettings     = lazy(() => import('./pages/settings/OpportunityFeedSettings'));
const NotificationsSettings       = lazy(() => import('./pages/settings/NotificationsSettings'));
const IntegrationsSettings        = lazy(() => import('./pages/settings/IntegrationsSettings'));
const WorkspaceSettings           = lazy(() => import('./pages/settings/WorkspaceSettings'));
const BillingSettings             = lazy(() => import('./pages/settings/BillingSettings'));
const SecuritySettings            = lazy(() => import('./pages/settings/SecuritySettings'));
const DataPrivacySettings         = lazy(() => import('./pages/settings/DataPrivacySettings'));

function Wrap({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RequireEmailVerified>{children}</RequireEmailVerified>
    </Suspense>
  );
}

/** Routes that require an active Pro subscription */
function Gated({ children }: { children: ReactNode }) {
  return <Wrap><RequireSubscription>{children}</RequireSubscription></Wrap>;
}

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  public?: boolean;
  children?: RouteConfig[];
}

/**
 * Routes are defined as factory functions (not module-level JSX) to prevent
 * "Cannot read properties of null (reading 'useRef')" during Vite HMR / React Refresh.
 * JSX is only evaluated inside React's render cycle, never at module-load time.
 */
export function buildRoutes(): RouteConfig[] {
  return [
    // ── Public ─────────────────────────────────────────────
    { name: 'Landing',          path: '/',                 element: <Wrap><LandingPage /></Wrap>,           public: true },
    { name: 'Login',            path: '/login',            element: <Wrap><LoginPage /></Wrap>,             public: true },
    { name: 'Onboarding',       path: '/onboarding',       element: <Wrap><OnboardingPage /></Wrap>,        public: true },
    { name: 'Auth Callback',    path: '/auth/callback',    element: <Wrap><AuthCallbackPage /></Wrap>,      public: true },
    { name: 'Terms',            path: '/terms',            element: <Wrap><TermsPage /></Wrap>,             public: true },
    { name: 'Privacy',          path: '/privacy',          element: <Wrap><PrivacyPage /></Wrap>,           public: true },
    { name: 'Contact',          path: '/contact',          element: <Wrap><ContactPage /></Wrap>,           public: true },
    { name: 'Affiliate',        path: '/affiliate',        element: <Wrap><AffiliatePage /></Wrap>,         public: true },
    { name: 'Docs',             path: '/docs',             element: <Suspense fallback={null}><DocsPage /></Suspense>, public: true },
    { name: 'Blog',             path: '/blog',             element: <Suspense fallback={null}><BlogIndexPage /></Suspense>, public: true },
    { name: 'Blog Post',        path: '/blog/:slug',       element: <Suspense fallback={null}><BlogPostPage /></Suspense>, public: true },
    { name: 'Forgot Password',  path: '/forgot-password',  element: <Wrap><ForgotPasswordPage /></Wrap>,    public: true },
    { name: 'Reset Password',   path: '/reset-password',   element: <Wrap><ResetPasswordPage /></Wrap>,     public: true },
    { name: 'Verify Email',     path: '/verify-email',     element: <Suspense fallback={null}><VerifyEmailPage /></Suspense>, public: true },
    // ── Auth-only ────────────────────────────────────────────
    { name: 'Billing', path: '/billing', element: <Wrap><BillingPage /></Wrap> },
    // ── Settings (nested) ────────────────────────────────────
    {
      name: 'Settings', path: '/settings', element: <Wrap><SettingsLayout /></Wrap>,
      children: [
        { name: 'Settings Index',       path: '',                    element: <Navigate to="profile" replace /> },
        { name: 'Profile',              path: 'profile',             element: <Wrap><ProfileSettings /></Wrap> },
        { name: 'Founder Preferences',  path: 'founder-preferences', element: <Wrap><FounderPreferencesSettings /></Wrap> },
        { name: 'AI Cofounder',         path: 'ai-cofounder',        element: <Wrap><AiCofoundersSettings /></Wrap> },
        { name: 'Opportunity Feed',     path: 'opportunity-feed',    element: <Wrap><OpportunityFeedSettings /></Wrap> },
        { name: 'Notifications',        path: 'notifications',       element: <Wrap><NotificationsSettings /></Wrap> },
        { name: 'Integrations',         path: 'integrations',        element: <Wrap><IntegrationsSettings /></Wrap> },
        { name: 'Workspace',            path: 'workspace',           element: <Wrap><WorkspaceSettings /></Wrap> },
        { name: 'Billing Settings',     path: 'billing',             element: <Wrap><BillingSettings /></Wrap> },
        { name: 'Security',             path: 'security',            element: <Wrap><SecuritySettings /></Wrap> },
        { name: 'Data & Privacy',       path: 'data-privacy',        element: <Wrap><DataPrivacySettings /></Wrap> },
      ],
    },
    // ── Free + Premium ────────────────────────────────────────
    { name: 'Dashboard',              path: '/dashboard',           element: <Wrap><DashboardHomePage /></Wrap> },
    { name: 'Kira',                   path: '/kira',                element: <Wrap><KiraPage /></Wrap> },
    { name: 'Opportunities',          path: '/opportunities',       element: <Wrap><OpportunitiesPage /></Wrap> },
    { name: 'Opportunity Intelligence', path: '/opportunity/:slug', element: <Wrap><OpportunityIntelligencePage /></Wrap> },
    // ── AI Agent pages — require subscription ────────────────
    { name: 'Research Agent',         path: '/research',            element: <Gated><ResearchAgentPage /></Gated> },
    { name: 'Validation Agent',       path: '/validation',          element: <Gated><ValidationAgentPage /></Gated> },
    { name: 'Startup Teardown',       path: '/teardown',            element: <Wrap><StartupTeardownPage /></Wrap> },
    { name: 'Competitors',            path: '/competitors',         element: <Wrap><CompetitorsPage /></Wrap> },
    { name: 'Competitor Intelligence',path: '/competitors/intelligence', element: <Gated><CompetitorIntelligencePage /></Gated> },
    { name: 'MVP Planner',            path: '/mvp-planner',         element: <Gated><MvpPlannerPage /></Gated> },
    { name: 'Launch Agent',           path: '/launch-agent',        element: <Gated><LaunchAgentPage /></Gated> },
    { name: 'Blueprint Agent',        path: '/blueprint',           element: <Gated><BlueprintAgentPage /></Gated> },
    { name: 'Watchlist',              path: '/watchlist',           element: <Gated><WatchlistPage /></Gated> },
    { name: 'Report Viewer',          path: '/report/:id',          element: <Gated><ReportViewerPage /></Gated> },
    { name: 'Content Generator',      path: '/content-generator',   element: <Wrap><ContentGeneratorPage /></Wrap> },
    { name: 'Reports',                path: '/reports',             element: <Gated><ReportsPage /></Gated> },
    { name: 'Affiliate Dashboard',    path: '/affiliate/dashboard', element: <Gated><AffiliateDashboardPage /></Gated> },
    // ── Referral redirect (/ref/:code) ───────────────────────
    { name: 'Referral Redirect',      path: '/ref/:code',           element: <Suspense fallback={null}><ReferralRedirectPage /></Suspense>, public: true },
    // ── Admin ────────────────────────────────────────────────
    { name: 'Admin Affiliates',       path: '/admin/affiliates',    element: <Wrap><AdminAffiliatesPage /></Wrap> },
  ];
}
