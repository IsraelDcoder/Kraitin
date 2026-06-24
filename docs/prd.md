# Requirements Document

## 1. Application Overview

### 1.1 Application Name
KRAITIN - The AI Cofounder That Tells You What To Build

### 1.2 Application Description
Kraitin is a premium SaaS web application positioned as「The Bloomberg Terminal for Founders」. It eliminates uncertainty for entrepreneurs by helping them discover opportunities, validate ideas, analyze competitors, build intelligent MVPs, and launch products with confidence.

### 1.3 Design Philosophy
High-end, professional, mature, and refined aesthetic inspired by Linear, Stripe, Apple, Arc Browser, and Bloomberg Terminal. Visual style combines liquid glass, glassmorphism, soft depth, dynamic blur, and premium enterprise SaaS design patterns.

### 1.4 Design System

**Color Scheme:**
- Background: #070B14
- Surface: #0F172A
- Card: rgba(255,255,255,0.04)
- Border: rgba(255,255,255,0.08)
- Primary: #5B8CFF
- Success: #00D97E
- Warning: #FFB547
- Danger: #FF5D73
- Text Primary: #FFFFFF
- Text Secondary: #94A3B8

**Typography:**
- Headings: Inter Tight
- Body: Inter
- Numbers: IBM Plex Mono

**Visual Effects:**
Liquid glass panels, blur overlays, subtle gradients, floating cards, animated glows, smooth transitions

## 2. Users and Use Cases

### 2.1 Target Users
- Entrepreneurs seeking validated business opportunities
- Business owners evaluating market potential
- Product managers researching competitive landscape
- Solo founders building MVPs

### 2.2 Core Use Cases
- Discover high-potential startup opportunities through data-driven insights
- Validate startup ideas through market research and competitor analysis
- Plan MVP scope and technical architecture
- Develop launch strategy and growth tactics
- Generate ready-to-post social media content for Twitter/X and LinkedIn

## 3. Page Structure and Functionality

### 3.1 Page Hierarchy

```
Kraitin Application
├── Landing Page (Public)
│   ├── Hero Section
│   ├── Value Proposition
│   ├── Features Overview
│   ├── Pricing Section
│   └── CTA Section
├── Authentication
│   ├── Login Page
│   └── Registration Page
└── Authenticated Application
    ├── Dashboard
    ├── Opportunities
    ├── Research Agent
    ├── Validation Agent
    ├── Startup Teardown
    ├── Competitors
    ├── MVP Planner
    ├── Launch Agent
    ├── Content Generator
    ├── Reports
    ├── Billing
    └── Settings
```

### 3.2 Landing Page (Public)

**Purpose:** Showcase product value proposition and convert visitors to users

**Core Sections:**
- Hero section with product tagline and primary CTA
- Value proposition highlighting core benefits
- Features overview showcasing 6 AI agents
- Pricing comparison table (Free and Pro plans)
- Sign-up call to action

**Pricing Section:**

**Free Plan ($0):**
- Opportunity Database access
- Trending, Rising, Hidden Gems opportunities
- AI Apps, B2B SaaS, Consumer Apps, Mobile Apps categories
- Startup Discovery and Search
- CTA: \"Get Started Free\"

**Pro Plan ($49/month or $490/year):**
- 500 Monthly Credits
- All 5 AI Agents (Research, Validation, Competitor Intel, MVP Planner, Launch Agent)
- Startup Teardown
- Workspace
- Blueprints
- Watchlists
- Saved Reports
- Competitor Tracking
- Export Features
- Priority Processing
- CTA: \"Start Pro\"

### 3.3 Authentication Pages

**Login Page:**
- Email and password input fields
- Login button
- Link to registration page
- Google Login option (via OSS Google Login)
- Apple Login option (via Supabase OAuth)

**Registration Page:**
- Email, password, and confirm password input fields
- Registration button
- Link to login page
- Google Login option (via OSS Google Login)
- Apple Login option (via Supabase OAuth)

**Email Verification:**
- After registration, system sends verification email to user
- User must click verification link in email to confirm account
- Dashboard access is blocked until email is verified
- Unverified users see verification reminder with resend option

### 3.4 Dashboard (Founder Command Center)

**Purpose:** Provide centralized overview of opportunities, alerts, market intelligence, and credit usage

**Core Components:**

#### 3.4.1 Today's Opportunities

**Functionality:**
- Display list of recommended startup opportunities for today
- Each opportunity card includes:
  - Opportunity title
  - Category tag (AI, Health, Productivity, Education, B2B SaaS, Consumer)
  - Opportunity score (0-100)
  - Growth rate percentage
  - Revenue estimate
  - Competition score
- Support clicking opportunity card to view details
- Default display shows fastest-growing applications

**Data Source:**
- Load data from opportunities table
- Sort by growth rate descending
- Default display shows top 5-8 opportunities

#### 3.4.2 Competitor Alerts

**Functionality:**
- Display recent competitor activity information
- Each alert includes:
  - Competitor name
  - Activity type (new product, funding, feature update, ad spend change, etc.)
  - Timestamp
  - Growth metrics
  - Feature launch information
  - Ad spend changes
- Sort by timestamp descending

**Data Source:**
- Load data from competitors table
- Filter activities within last 7 days
- Default display shows top 5 alerts

#### 3.4.3 Trending Keywords

**Functionality:**
- Display current market trending keywords and search trends
- Each keyword includes:
  - Keyword name
  - Category tag
  - Trend indicator (rising/falling/stable)
- Example keywords: AI Companion, AI Diet, Study App, Voice Agent, Legal AI

**Data Source:**
- Load keyword data from market_analysis table
- Sort by trend heat descending
- Default display shows top 8-10 keywords

#### 3.4.4 Market Radar

**Functionality:**
- Visualize market opportunity distribution
- Use radar chart or heat map to show heat of different market segments
- Display content includes:
  - Market segment name
  - Growth metrics
  - Competition level
  - Demand metrics
- Support clicking market segment to view detailed information

**Data Source:**
- Load market data from market_analysis table
- Aggregate key metrics for each market segment

#### 3.4.5 Saved Opportunities

**Functionality:**
- Display opportunities saved by user via watchlist
- Each saved opportunity includes:
  - Opportunity title
  - Save timestamp
  - Opportunity score
  - Quick access button
- Support clicking to view details
- Support unsave operation

**Data Source:**
- Load data from saved_items table
- Filter opportunity type records saved by current user
- Sort by save timestamp descending
- Default display shows top 5 saved opportunities

#### 3.4.6 Credits Overview Widget

**Functionality:**
- Display credit usage information for Pro plan users
- Show:
  - Credits Remaining (e.g., 487 / 500)
  - Progress bar
  - Reset Date (e.g., \"Credits reset on July 24, 2026\")
  - Usage Breakdown by agent type:
    - Research Reports count
    - Validation Reports count
    - Competitor Reports count
    - Startup Teardowns count
    - MVP Plans count
    - Launch Plans count
- Warning badge when credits remaining below 20%
- Free plan users do not see this widget

**Data Source:**
- Load data from subscriptions table (credits_remaining, credits_limit, current_period_start)
- Load usage data from activity_logs table
- Calculate credits used and breakdown by agent type

#### 3.4.7 Plan Card

**Functionality:**

**Free Plan Users:**
- Display: Plan: Free
- Display: Credits: 0
- Display: Upgrade Button

**Pro Plan Users:**
- Display: Plan: Pro
- Display: Credits: 487/500
- Display: Renewal Date (e.g., \"Renews on July 24, 2026\")
- Display: Manage Subscription button

**Design Style:**
- Dark theme
- Moderate information density
- Establish visual hierarchy through font size, weight, spacing
- Restrained and concise design language

### 3.5 Opportunities Module

**Purpose:** Discover and evaluate startup opportunities

**Core Functionality:**

1. **Opportunity Feed**
   - Display daily feed of apps, SaaS products, AI tools
   - Show revenue estimates
   - Show download counts
   - Show growth velocity

2. **Hidden Gems Engine**
   - Filter opportunities by low competition
   - Filter by high demand
   - Show rising trends

3. **Trend Explorer**
   - Category filters: AI, Health, Productivity, Education, B2B SaaS, Consumer
   - Apply filters to opportunity feed

4. **Opportunity Scoring**
   - Calculate score (0-100) based on:
     - Market size
     - Competition level
     - Demand signals
     - Monetization potential
     - Growth factors

**Access Control:**
- Free plan users can access all opportunity browsing features
- Saving opportunities to watchlist requires Pro plan

### 3.6 Research Agent Module

**Purpose:** Generate comprehensive market research reports for startup ideas

**Core Functionality:**

1. **Input Interface**
   - Natural language text input box
   - Example: \"I want to build an AI meal scanner\"
   - Submit button to generate report

2. **Report Generation**
   - Process input using AI Search skill (<SKILL>ai-search</SKILL>)
   - Generate report with following sections:
     - Executive Summary
     - Market Analysis
     - TAM (Total Addressable Market)
     - Market Growth
     - Demand Signals
     - Competitors
     - SWOT Analysis
     - Why Users Buy
     - Risks
     - Monetization Strategy
     - Recommendations

3. **Report Export**
   - Generate professional PDF report from markdown content
   - Generate DOCX report from markdown content

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

**Credit Cost:**
- Research Report generation costs 5 credits

### 3.7 Validation Agent Module

**Purpose:** Validate startup ideas through community insights and user feedback

**Core Functionality:**

1. **Data Source Integration**
   - Analyze Reddit discussions
   - Analyze online communities
   - Analyze app reviews
   - Analyze search trends

2. **Reddit Intelligence**
   - Extract pain points from discussions
   - Identify feature requests
   - Collect user complaints

3. **App Review Mining**
   - Analyze App Store reviews
   - Analyze Play Store reviews
   - Identify bugs and complaints
   - Extract requested features

4. **Pain Point Ranking**
   - Rank pain points by frequency
   - Display top issues

5. **Validation Score**
   - Calculate scores for:
     - Demand level
     - Pain point intensity
     - Competition level
     - Monetization potential
   - Generate overall recommendation

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

**Credit Cost:**
- Validation Report generation costs 10 credits

### 3.8 Startup Teardown Module

**Purpose:** Provide deep intelligence reports on existing startups and competitors

**Core Functionality:**

1. **Search Interface**
   - Company name or URL input field
   - Submit button to generate teardown

2. **Teardown Report Sections**
   - Company Name
   - Category
   - Estimated Revenue
   - Growth Score
   - Market Position
   - Top Growth Channel
   - Revenue Breakdown
   - Content Intelligence
   - Moat Analysis
   - Weaknesses
   - Opportunity Gaps
   - Clone Blueprint
   - AI Verdict

**Access Control and Paywall Behavior:**

**Free Plan Users:**
- Can search and view Preview Only
- Visible sections:
  - Company Name
  - Category
  - Estimated Revenue
  - Growth Score
  - Market Position
  - Top Growth Channel
- Blurred/locked sections:
  - Revenue Breakdown
  - Content Intelligence
  - Moat Analysis
  - Weaknesses
  - Opportunity Gaps
  - Clone Blueprint
  - AI Verdict
- Display message: \"Unlock Full Startup Teardown — Upgrade to Kraitin Pro to access complete startup intelligence reports.\"
- Display button: \"Unlock Report\"

**Pro Plan Users:**
- Full access to all teardown sections
- Can export report as PDF or DOCX

**Credit Cost:**
- Startup Teardown generation costs 15 credits

### 3.9 Competitors Module

**Purpose:** Analyze competitor performance and marketing strategies

**Core Functionality:**

1. **Competitor Dashboard**
   - Display revenue estimates
   - Display download counts
   - Display pricing information
   - Display traffic metrics
   - Display growth trends
   - Load all data from live database queries

2. **Marketing Breakdown**
   - Analyze SEO strategy
   - Analyze TikTok presence
   - Analyze YouTube content
   - Analyze Instagram activity
   - Identify influencer partnerships
   - Track paid advertising

3. **Ad Creative Library**
   - Display ad hooks
   - Display creative examples
   - List marketing angles
   - Display offers

4. **Influencer Database**
   - List relevant influencers
   - Display follower counts
   - Display niche categories
   - Estimate sponsorship costs

5. **Competitor Comparison Matrix**
   - Compare unlimited products side-by-side
   - Display key metrics in table format

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

**Credit Cost:**
- Competitor Intel generation costs 10 credits

### 3.10 MVP Planner Module

**Purpose:** Generate comprehensive MVP development plan

**Core Functionality:**

1. **Input Interface**
   - Startup idea description text input
   - Submit button to generate plan

2. **MVP Plan Generation**
   - Generate MVP scope
   - Create feature prioritization
   - Define user stories
   - Design database schema
   - Recommend APIs
   - Outline technical architecture
   - Create development timeline
   - Generate sprint breakdown with week-by-week roadmap

3. **PRD Generator**
   - Generate Product Requirements Document
   - Create user flows
   - Define acceptance criteria

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

**Credit Cost:**
- MVP Planner generation costs 10 credits
- PRD Generation costs 15 credits
- Technical Architecture costs 15 credits
- Complete Startup Blueprint costs 25 credits

### 3.11 Launch Agent Module

**Purpose:** Develop comprehensive launch and growth strategy

**Core Functionality:**

1. **Launch Strategy Generation**
   - SEO recommendations
   - TikTok strategy
   - Influencer outreach plan
   - Community engagement strategy
   - Partnership opportunities

2. **Content Generator**
   - Generate TikTok content ideas
   - Generate YouTube video ideas
   - Generate X (Twitter) thread templates
   - Generate LinkedIn post templates

3. **ASO Generator**
   - Recommend keywords
   - Generate app title
   - Generate app description
   - Provide screenshot guidance

4. **Growth Loops**
   - Design referral systems
   - Define viral mechanisms
   - Create retention loops

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

**Credit Cost:**
- Launch Strategy generation costs 10 credits

### 3.12 Content Generator Module

**Purpose:** Generate ready-to-post social media content for Twitter/X and LinkedIn based on opportunity data

**Core Functionality:**

#### 3.12.1 Opportunity Selector

**Functionality:**
- Display searchable, filterable list of opportunities from opportunities table
- Each opportunity shows:
  - Title
  - Category
  - Opportunity score
  - Market size
  - Growth percent
  - Revenue estimate
- User selects one opportunity to generate content for
- Filter by category
- Sort by score

**Data Source:**
- Load data from opportunities table
- Support search by title
- Support filter by category
- Support sort by opportunity_score

#### 3.12.2 Content Type Selector

**Functionality:**
- User selects one content type:
  - Twitter/X Thread (7-tweet format using Opportunity Showcase template)
  - Twitter/X Hot Take (single punchy tweet)
  - LinkedIn Long-form Post (framework/analysis style)
  - LinkedIn Carousel Caption (hook + 5 bullet points + CTA)

#### 3.12.3 Tone Selector

**Functionality:**
- User selects one tone:
  - Data-driven (facts, numbers, metrics)
  - Founder story (personal, narrative)
  - Hot take (contrarian, opinionated)
  - Educational (frameworks, how-to)

#### 3.12.4 Generate Button

**Functionality:**
- Calls large-language-model skill (Gemini 2.5 Flash via edge function)
- Generates content using SSE streaming
- Shows streaming output panel as content generates in real-time

**Prompt Templates:**
- Twitter thread: 7-tweet opportunity showcase with market data, problem, solution, revenue model, risk, CTA
- Twitter hot take: contrarian single tweet with CTA
- LinkedIn long-form: 4-step validation framework post with opportunity woven in
- LinkedIn carousel: hook headline + 5 data-backed bullets + CTA
- Inject actual opportunity data fields (title, category, opportunity_score, market_size, revenue_estimate, growth_percent, description, tags) into templates

#### 3.12.5 Generated Content Panel

**Functionality:**
- Display full drafted post/thread with proper formatting
- Show character count:
  - Twitter: 280 per tweet
  - LinkedIn: 3000 chars
- Copy to clipboard button for each tweet/post section
- Regenerate button (re-runs generation with same inputs)
- Save Draft button

**Save Draft:**
- Saves to content_drafts table in Supabase
- Fields: user_id, opportunity_id, platform, content, tone, created_at, status ('draft' or 'posted')

#### 3.12.6 Drafts Library

**Functionality:**
- Display all saved drafts for logged-in user
- Columns:
  - Opportunity title
  - Platform
  - Tone
  - Created date
  - Status
  - Preview (first 100 chars)
- Mark as Posted button
- Delete draft button
- Click to re-open and copy

**Data Source:**
- Load data from content_drafts table
- Filter by user_id = current user
- Sort by created_at descending

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

### 3.13 Reports Module

**Purpose:** Organize and manage generated reports

**Core Functionality:**

1. **Folder Organization**
   - Opportunities folder
   - Validation reports folder
   - Competitor reports folder
   - Startup teardowns folder
   - MVP plans folder
   - Launch plans folder

2. **Report Management**
   - View saved reports
   - Search reports
   - Delete reports

3. **Export Functionality**
   - Export as PDF (generate real downloadable PDF from markdown content)
   - Export as DOCX (generate real downloadable DOCX from markdown content)
   - Export as Markdown
   - Export as CSV (export reports list as CSV)

**Access Control:**
- Requires Pro plan
- Free plan users see upgrade modal when attempting to access

### 3.14 Billing Module

**Purpose:** Manage subscription plans and payments

**Core Functionality:**

#### 3.14.1 Pricing Display

**Two Plans:**

**FREE Plan ($0):**
- Status: active, tier: free
- Auto-assigned on signup
- No credit card required
- Features:
  - Browse startup opportunities
  - Opportunity Database access
  - Trending/Rising/Hidden Gems opportunities
  - AI Apps/Mobile Apps/Consumer Apps/B2B SaaS categories
  - Opportunity Search & Filtering
  - View Opportunity Details
  - Startup Scores
  - Growth Metrics
  - Revenue Estimates

**PRO Plan ($49/month or $490/year):**
- Status: active, tier: pro
- Labeled \"Most Popular\"
- Features:
  - 500 Monthly Credits (reset monthly, unused credits do not roll over)
  - All 5 AI Agents (Research, Validation, Competitor Intel, MVP Planner, Launch Agent)
  - Startup Teardown
  - Workspace
  - Saved Reports
  - Watchlists
  - Blueprints
  - Competitor Tracking
  - Priority Generation
  - Advanced AI Models
  - Export Features

#### 3.14.2 Current Plan Display

**Functionality:**
- Display active subscription tier (Free or Pro)
- For Pro plan users:
  - Display credits remaining (e.g., 487 / 500)
  - Display next reset date
  - Display usage breakdown
- For Free plan users:
  - Display upgrade prompt
  - List Pro plan benefits

#### 3.14.3 Plan Upgrade

**Functionality:**
- Free plan users can upgrade to Pro plan
- Click upgrade button to initiate Stripe checkout
- After successful payment, subscription status updates to Pro
- Credits are initialized to 500

#### 3.14.4 Plan Downgrade

**Functionality:**
- Pro plan users can cancel subscription
- Cancellation takes effect at end of current billing cycle
- User retains Pro access until period end
- After period end, tier changes to free, status changes to cancelled

#### 3.14.5 Payment Management

**Functionality:**
- Update payment method via Stripe portal
- View billing history
- Download invoices

**Rate Limiting:**
- Implement rate limiting on create-checkout endpoint to prevent abuse
- Implement rate limiting on stripe-portal endpoint to prevent abuse

### 3.15 Settings Module

**Purpose:** Manage account preferences and configuration

**Core Functionality:**

1. **Profile Settings**
   - Update email
   - Change password
   - Update profile information

2. **Notification Preferences**
   - Configure email notifications
   - Configure alert preferences

3. **Security Settings**
   - Enable/disable Two-Factor Authentication (2FA) using Supabase TOTP-based 2FA
   - View and manage active sessions (show and revoke real Supabase sessions)

4. **Account Management**
   - Delete account option

## 4. Business Rules and Logic

### 4.1 AI Agent System Architecture

Application uses 6 specialized AI agents coordinated by a master orchestrator:

1. **Agent 1: Opportunity Agent**
   - Discover and score startup opportunities
   - Analyze market trends and growth signals

2. **Agent 2: Research Agent**
   - Generate comprehensive market research reports
   - Analyze TAM, competition, and demand

3. **Agent 3: Validation Agent**
   - Validate ideas through community insights
   - Mine pain points from reviews and discussions

4. **Agent 4: Competitor Agent**
   - Analyze competitor performance and strategies
   - Track marketing campaigns and growth

5. **Agent 5: MVP Planner Agent**
   - Generate MVP scope and technical plans
   - Create development roadmaps

6. **Agent 6: Launch Agent**
   - Develop launch strategies
   - Generate marketing content

**Master Orchestrator:**
- Coordinate agent activities
- Manage data flow between agents
- Ensure output consistency

### 4.2 Subscription and Access Control

#### 4.2.1 New User Flow

1. Visitor visits landing page
2. Visitor creates account via registration page
3. System automatically assigns Free plan (tier: free, status: active)
4. User receives email verification
5. User confirms email and accesses dashboard
6. User explores opportunities (no restrictions)
7. User attempts premium action (e.g., Research Agent, Startup Teardown, Save Report, Add to Watchlist)
8. System displays upgrade modal
9. User subscribes to Pro plan
10. Features unlock immediately

#### 4.2.2 Free Plan ($0)

**Status:** tier: free, status: active (auto-assigned on signup)

**Can Access:**
- Opportunity Database
- Trending/Rising/Hidden Gems opportunities
- AI Apps/Mobile Apps/Consumer Apps/B2B SaaS categories
- Opportunity Search & Filtering
- View Opportunity Details
- Startup Scores
- Growth Metrics
- Revenue Estimates
- Startup Teardown Preview (limited sections visible)

**Cannot Access:**
- Research Agent
- Validation Agent
- Competitor Intel Agent
- Full Startup Teardown
- MVP Planner
- Launch Agent
- Saved Reports
- Watchlists
- Blueprints
- Competitors Workspace
- Report Exporting
- Deep Analysis

#### 4.2.3 Pro Plan ($49/month or $490/year)

**Status:** tier: pro, status: active

**Includes:**
- 500 Monthly Credits (reset monthly, unused credits do not roll over)
- All 5 AI Agents
- Startup Teardown (full access)
- Workspace
- Saved Reports
- Watchlists
- Blueprints
- Competitor Tracking
- Priority Generation
- Advanced AI Models
- Export Features

#### 4.2.4 Access Control Logic

**Frontend Auth Logic:**
- Replace all isSubscribed complexity with: `premiumAccess = subscription.tier !== 'free'`
- Free plan users attempting to access premium features see upgrade modal

**Backend Auth Logic:**
- Edge function (ai-search) checks: allow if tier !== 'free'
- Return 403 Forbidden if tier === 'free'

#### 4.2.5 Paywall Triggers

When free user clicks following actions, show upgrade modal:
- Research Agent
- Validation Agent
- Competitor Intel
- Startup Teardown (full report)
- Generate Report
- Save Report
- Add To Watchlist
- Create Blueprint
- Launch Planner
- Export

#### 4.2.6 Upgrade Modal

**Content:**
- Headline: \"Unlock Kraitin Pro\"
- Subheadline: \"Access all 5 AI Agents, Startup Teardowns, Blueprints, Workspace, Watchlists and 500 monthly credits.\"
- Features list:
  - Research Agent
  - Validation Agent
  - Startup Teardown
  - Competitor Intelligence
  - MVP Planner
  - Launch Agent
  - Workspace
  - Saved Reports
  - Watchlists
  - Blueprints
  - 500 Credits Every Month
- CTA: \"Upgrade To Pro\"

### 4.3 Credit System

#### 4.3.1 Credit Allocation

**Pro Plan:**
- 500 monthly credits
- Credits reset monthly on billing cycle start
- Unused credits do not roll over

**Free Plan:**
- No credits allocated
- Cannot perform AI actions

#### 4.3.2 Credit Costs

**AI Actions:**
- Research Report = 5 credits
- Validation Report = 10 credits
- Competitor Intelligence Report = 10 credits
- Startup Teardown = 15 credits
- MVP Planner = 10 credits
- Launch Strategy = 10 credits
- PRD Generation = 15 credits
- Technical Architecture = 15 credits
- Complete Startup Blueprint = 25 credits

**Zero-Cost Actions:**
- Browsing opportunities
- Viewing opportunity details
- Navigation
- Searching
- Filtering

#### 4.3.3 Credit Display

**Dashboard Header:**
- Show \"Credits Remaining\" (e.g., \"487 / 500 Credits Remaining\")
- Progress bar
- Reset date (e.g., \"Credits reset on July 24, 2026\")
- Warning badge when below 20% remaining (e.g., below 100 credits)

**Dashboard Widget:**
- Credits Remaining
- Credits Used
- Reset Date
- Usage Breakdown by agent type

#### 4.3.4 Credit Deduction Flow

1. User clicks premium action (e.g., Generate Research Report)
2. System checks credits_remaining >= required credits
3. IF yes:
   - Deduct credits from credits_remaining
   - Generate report
   - Save report
   - Update activity_logs
4. IF no:
   - Display insufficient credits message
   - Show upgrade modal or wait-for-reset message
   - Block action

#### 4.3.5 Credit Reset Logic

**Monthly Reset:**
- Triggered on Stripe current_period_start via webhook or cron
- For Pro plan users:
  - Reset credits_remaining to 500
  - Update current_period_start timestamp
- For Free plan users:
  - No action

**Implementation:**
- Stripe webhook listens for invoice.payment_succeeded event
- Update subscriptions table: credits_remaining = 500, current_period_start = new period start

#### 4.3.6 Zero Credits Handling

**When credits_remaining = 0:**
- AI generation disabled
- User sees message: \"You've used all 500 credits this month. Credits reset on [date].\"
- User can wait for monthly reset

### 4.4 Report Generation Flow

1. User submits input through module interface
2. System verifies subscription tier (must be Pro)
3. System verifies credits_remaining >= required credits
4. AI agent processes request using AI Search skill (<SKILL>ai-search</SKILL>)
5. System generates report with structured sections
6. System deducts credits from credits_remaining
7. Report is saved to user's reports folder
8. User receives report completion notification
9. Activity log is updated

### 4.5 Data Storage

Application uses following database tables:

- users: Store user account information
- subscriptions: Store subscription plans and status (id, user_id, tier, status, credits_remaining, credits_limit, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id, stripe_price_id, created_at, updated_at)
- profiles: Store user profile information
- reports: Store generated reports
- opportunities: Store discovered opportunities
- competitors: Store competitor data
- market_analysis: Store market research data
- validation_reports: Store validation results
- launch_plans: Store launch strategies
- mvp_plans: Store MVP plans
- saved_items: Store user-saved opportunities and reports
- notifications: Store user notifications
- activity_logs: Store user activity history
- content_drafts: Store generated social media content drafts (user_id, opportunity_id, platform, content, tone, created_at, status)

### 4.6 Opportunity Scoring Algorithm

Opportunity score (0-100) calculated based on following factors:
- Market size factor (20%)
- Competition level factor (20%)
- Demand signal factor (20%)
- Monetization potential factor (20%)
- Growth trajectory factor (20%)

Higher scores indicate better opportunities.

### 4.7 Validation Scoring Algorithm

Validation score includes:
- Demand score: Based on search volume and community interest
- Pain point score: Based on frequency and intensity of user complaints
- Competition score: Based on number and strength of competitors
- Monetization score: Based on willingness-to-pay signals
- Overall recommendation: Aggregated score with actionable guidance

### 4.8 Dashboard Data Loading Logic

**Today's Opportunities Data Loading:**
- Query data from opportunities table
- Filter condition: Created within last 24 hours
- Sort: By growth rate descending
- Limit: Return top 5-8 records

**Competitor Alerts Data Loading:**
- Query data from competitors table
- Filter condition: Updated within last 7 days
- Sort: By update timestamp descending
- Limit: Return top 5 records

**Trending Keywords Data Loading:**
- Query keyword data from market_analysis table
- Filter condition: Trend heat > threshold
- Sort: By trend heat descending
- Limit: Return top 8-10 records

**Market Radar Data Loading:**
- Query market data from market_analysis table
- Aggregate growth metrics, competition level, demand metrics for each market segment
- Generate visualization data structure

**Saved Opportunities Data Loading:**
- Query data from saved_items table
- Filter condition: user_id = current user ID AND item_type = 'opportunity'
- Sort: By save timestamp descending
- Limit: Return top 5 records

**Credits Overview Data Loading:**
- Query data from subscriptions table (credits_remaining, credits_limit, current_period_start)
- Query usage data from activity_logs table
- Calculate credits used and breakdown by agent type
- Display only for Pro plan users

### 4.9 Content Generator Logic

**Content Generation Flow:**
1. User selects opportunity from opportunities table
2. User selects content type (Twitter Thread, Twitter Hot Take, LinkedIn Long-form, LinkedIn Carousel)
3. User selects tone (Data-driven, Founder story, Hot take, Educational)
4. User clicks Generate button
5. System calls large-language-model skill with prompt template
6. Prompt template injects opportunity data fields (title, category, opportunity_score, market_size, revenue_estimate, growth_percent, description, tags)
7. System streams generated content via SSE
8. User reviews generated content in panel
9. User can copy to clipboard, regenerate, or save draft
10. Saved drafts stored in content_drafts table

**Drafts Management:**
- User can view all saved drafts in Drafts Library
- User can mark draft as posted
- User can delete draft
- User can click draft to re-open and copy

### 4.10 Security and Production Readiness

#### 4.10.1 API Security

**all-news Endpoint Security:**
- Implement JWT authentication verification
- Implement subscription tier verification
- Only authenticated users with valid subscriptions can access endpoint

**CORS Configuration:**
- Replace wildcard * with specific allowed origins on all edge functions
- Configure allowed origins list based on production domain

**Content Security Policy:**
- Add CSP headers to all responses
- Prevent XSS attacks
- Prevent clickjacking attacks

#### 4.10.2 Data Access Control

**Premium Data Protection:**
- Ensure competitors table is not publicly readable by unauthenticated users
- Ensure all premium data requires authentication and subscription verification
- Remove any public read access to premium tables
- Ensure content_drafts table requires authentication and user can only access own drafts

**Row Level Security:**
- Verify RLS policies are correctly configured on all tables
- Ensure users can only access their own data
- Ensure premium data requires appropriate subscription tier
- content_drafts table: user_id must match authenticated user

#### 4.10.3 Authentication and Verification

**Email Verification:**
- Enforce email confirmation before dashboard access
- Send verification email immediately after registration
- Block dashboard access for unverified users
- Provide resend verification email option

**Two-Factor Authentication:**
- Integrate Supabase TOTP-based 2FA
- Allow users to enable/disable 2FA in settings
- Require 2FA code during login when enabled

**Session Management:**
- Display real active Supabase sessions in settings
- Allow users to revoke individual sessions
- Show session details (device, location, last active)

#### 4.10.4 Rate Limiting

**Billing Endpoints:**
- Implement rate limiting on create-checkout endpoint
- Implement rate limiting on stripe-portal endpoint
- Prevent abuse and excessive API calls

#### 4.10.5 Analytics

**Event Tracking:**
- Integrate basic analytics (Plausible or custom event tracking)
- Track key user actions (report generation, exports, upgrades)
- Track page views and navigation patterns
- Respect user privacy and GDPR compliance

### 4.11 Subscription Status Rules

**Free User:**
- tier: free
- status: active

**Paid User:**
- tier: pro
- status: active

**Cancelled User:**
- tier: free
- status: cancelled

### 4.12 Primary Conversion Flow

**Monetization Engine:**
1. User discovers opportunity in Opportunities module
2. User wants more intelligence on opportunity
3. User clicks Startup Teardown
4. User sees preview with blurred premium sections
5. User hits paywall
6. User clicks \"Unlock Report\" button
7. User sees upgrade modal
8. User upgrades to Pro plan
9. User becomes subscriber

## 5. Exceptions and Edge Cases

| Scenario | Handling Method |
|----------|----------------|
| User attempts to access restricted module | Display subscription tier requirement, show upgrade modal |
| AI agent report generation fails | Display error message, do not deduct credits, allow retry |
| User submits empty or invalid input | Display validation error, prompt for valid input |
| Report generation exceeds expected time | Display progress indicator, send notification when complete |
| User cancels subscription | Downgrade to free tier at end of billing cycle, retain data |
| Payment fails | Send notification, allow grace period, restrict access if unresolved |
| User deletes account | Delete personal data, retain anonymized usage data |
| Competitor data unavailable | Display partial results, mark missing data |
| Export fails | Display error message, allow retry, provide alternative formats |
| Dashboard data loading fails | Display error prompt, provide refresh button, log error |
| saved_items table is empty | Saved Opportunities module displays empty state prompt |
| Supabase API connection timeout | Display network error prompt, allow retry |
| Unauthenticated user attempts to access all-news endpoint | Return 401 Unauthorized error |
| User without valid subscription attempts to access premium data | Return 403 Forbidden error |
| Email verification link expires | Allow user to request new verification email |
| 2FA setup fails | Display error message, allow retry, provide support contact |
| Session revocation fails | Display error message, log issue for investigation |
| Rate limit exceeded on billing endpoints | Return 429 Too Many Requests error, display retry-after message |
| PDF export generation fails | Display error message, allow retry, log error for investigation |
| DOCX export generation fails | Display error message, allow retry, log error for investigation |
| CSV export generation fails | Display error message, allow retry, log error for investigation |
| Non-subscriber attempts to access Content Generator | Display upgrade modal |
| Content generation fails | Display error message, allow retry, do not save failed draft |
| User attempts to save draft without generating content | Display validation error |
| content_drafts table is empty | Drafts Library displays empty state prompt |
| LLM streaming connection interrupted | Display error message, allow retry |
| User attempts to access another user's draft | Return 403 Forbidden error |
| opportunities table is empty | Opportunity Selector displays empty state prompt |
| Character count exceeds platform limit | Display warning message, highlight exceeded sections |
| Pro user credits_remaining = 0 | Display message: \"You've used all 500 credits this month. Credits reset on [date].\", block AI actions |
| Pro user attempts action with insufficient credits | Display insufficient credits message, block action |
| Credit reset fails | Log error, retry on next webhook event |
| Stripe webhook delivery fails | Implement retry logic, log failure for manual intervention |
| User upgrades mid-cycle | Credits initialize to 500 immediately, current_period_start updates |
| User downgrades mid-cycle | Pro access retained until period end, then tier changes to free |
| Free user attempts to save opportunity to watchlist | Display upgrade modal |
| subscriptions table query fails | Display error message, allow retry |
| activity_logs table write fails | Log error, do not block user action |
| Free user searches Startup Teardown | Display preview with visible sections, blur premium sections, show \"Unlock Report\" button |
| Free user clicks \"Unlock Report\" on Startup Teardown | Display upgrade modal |

## 6. Acceptance Criteria

1. User visits landing page, views product features and pricing (Free and Pro plans), clicks sign-up CTA
2. User completes registration with email and password, receives verification email
3. User clicks verification link in email, account is confirmed
4. User logs in and enters dashboard, sees Today's Opportunities, Competitor Alerts, Trending Keywords, Market Radar, Saved Opportunities displaying correctly
5. User sees Free plan status in Plan Card, views Pro plan features and pricing ($49/month or $490/year, 500 credits)
6. User clicks Research Agent, sees upgrade modal with headline \"Unlock Kraitin Pro\"
7. User clicks upgrade CTA, completes Stripe checkout, subscription updates to Pro plan
8. User sees credits remaining (500 / 500) in dashboard header and Credits Overview widget
9. User navigates to Research Agent, inputs startup idea (e.g., \"AI meal scanner\"), submits request
10. System deducts 5 credits, generates comprehensive research report, credits remaining updates to 495
11. User navigates to Startup Teardown, searches for a company, sees full teardown report with all sections unlocked
12. User navigates to Reports module, views saved research report, exports as PDF successfully
13. User enables 2FA in Settings, verifies TOTP code, 2FA is active
14. User views active sessions in Settings, revokes one session successfully
15. User navigates to Content Generator, selects an opportunity from list, chooses Twitter Thread content type and Data-driven tone, clicks Generate
16. System streams generated 7-tweet thread in real-time, user clicks Save Draft, draft is saved to content_drafts table
17. User navigates to Drafts Library, views saved draft, clicks Mark as Posted, status updates successfully
18. Free user searches Startup Teardown, sees preview with Company Name, Category, Estimated Revenue, Growth Score, Market Position, Top Growth Channel visible, and Revenue Breakdown, Content Intelligence, Moat Analysis, Weaknesses, Opportunity Gaps, Clone Blueprint, AI Verdict blurred
19. Free user clicks \"Unlock Report\" button on Startup Teardown preview, sees upgrade modal

## 7. Out of Scope for This Release

- Mobile native applications (iOS/Android)
- Real-time collaboration features
- Team workspaces and multi-user accounts
- Custom branding or white-label options
- API access for third-party integrations
- Advanced analytics dashboard with custom metrics
- Automated email marketing or drip sequences
- Integration with project management tools
- AI model fine-tuning or custom training
- Multi-language support beyond English
- Dark/light theme toggle
- Offline mode or PWA capabilities
- Video tutorials or interactive onboarding
- Community forum or user discussions
- Affiliate program or referral tracking dashboard
- Advanced user permissions and role management
- Data export automation or scheduled reports
- Custom report templates
- Integration with CRM systems
- Social media auto-posting functionality
- Direct posting to social media platforms from Content Generator
- Scheduling posts for future publication
- Analytics for posted content performance
- A/B testing for content variations
- Bulk content generation for multiple opportunities
- Content calendar or planning features
- Integration with social media management tools
- Credit rollover functionality
- Credit purchase or top-up options
- Credit gifting or transfer between users
- Variable credit pricing tiers
- Credit expiration dates
- 3-day free trial system
- Trial countdown timers
- Trial expiration logic
- Trial reminder emails
- Trial-related webhooks
- Trial database fields (trial_end, trial_reminder_sent)
- Trial UI components
- Stripe trial configuration
- Trialing subscription status