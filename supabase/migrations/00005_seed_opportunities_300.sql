
-- Clear existing seed data to avoid duplicates on re-run
DELETE FROM opportunities WHERE created_at < now();

INSERT INTO opportunities (title, category, description, revenue_estimate, downloads, growth_velocity, growth_percent, competition_score, opportunity_score, market_size, tags, is_hidden_gem) VALUES

-- ── AI TOOLS ────────────────────────────────────────────
('AI Email Writer for Cold Outreach', 'AI', 'Personalized cold email generator using LLMs that increases reply rates by 3×', '$8k–$40k MRR', '50k+/mo', 'Explosive', 82, 45, 91, '$2.1B', ARRAY['AI', 'email', 'outreach', 'B2B'], false),
('AI Meeting Summarizer', 'AI', 'Auto-summarize Zoom/Meet/Teams calls with action items and follow-ups', '$5k–$25k MRR', '30k+/mo', 'Rising', 74, 52, 87, '$1.4B', ARRAY['AI', 'meetings', 'productivity'], false),
('AI Resume Optimizer', 'AI', 'ATS-optimized resume rewriter tailored per job description', '$3k–$18k MRR', '80k+/mo', 'Rising', 68, 60, 84, '$900M', ARRAY['AI', 'resume', 'career'], false),
('AI Pricing Advisor for SaaS', 'AI', 'Analyzes churn and usage data to suggest optimal pricing tiers', '$10k–$60k MRR', '10k+/mo', 'Explosive', 88, 28, 94, '$3.2B', ARRAY['AI', 'pricing', 'SaaS', 'analytics'], true),
('AI Contract Reviewer', 'AI', 'Legal contract analysis, risk flagging, and plain-English summaries', '$12k–$80k MRR', '15k+/mo', 'Explosive', 85, 35, 93, '$4.5B', ARRAY['AI', 'legal', 'contracts'], false),
('AI Social Media Caption Generator', 'AI', 'Brand-voice captions for Instagram, TikTok, LinkedIn from a single brief', '$4k–$20k MRR', '200k+/mo', 'Rising', 62, 72, 78, '$1.1B', ARRAY['AI', 'social', 'content'], false),
('AI Onboarding Chatbot Builder', 'AI', 'No-code tool to build in-app AI onboarding flows for SaaS products', '$8k–$50k MRR', '8k+/mo', 'Rising', 78, 40, 89, '$2.8B', ARRAY['AI', 'onboarding', 'SaaS', 'chatbot'], true),
('AI Product Description Generator for E-commerce', 'AI', 'Bulk SEO product descriptions for Shopify/WooCommerce stores', '$2k–$12k MRR', '120k+/mo', 'Steady', 55, 68, 75, '$600M', ARRAY['AI', 'ecommerce', 'SEO', 'content'], false),
('AI Bug Triage Assistant', 'AI', 'Automatically categorizes and prioritizes GitHub issues using LLM context', '$6k–$35k MRR', '5k+/mo', 'Rising', 72, 38, 86, '$1.8B', ARRAY['AI', 'developer', 'devtools', 'bugs'], true),
('AI Competitive Intelligence Monitor', 'AI', 'Tracks competitor pricing, feature releases, and hiring signals in real-time', '$15k–$90k MRR', '12k+/mo', 'Explosive', 91, 32, 95, '$5.0B', ARRAY['AI', 'competitive', 'intelligence', 'B2B'], true),
('AI Voice Clone for Content Creators', 'AI', 'Clone your voice for podcast intros, YouTube narration, and ads', '$3k–$15k MRR', '60k+/mo', 'Rising', 71, 55, 82, '$800M', ARRAY['AI', 'voice', 'content', 'creators'], false),
('AI Interview Coach', 'AI', 'Mock interviews with real-time AI feedback on answers, tone, and confidence', '$2k–$10k MRR', '90k+/mo', 'Rising', 66, 58, 80, '$700M', ARRAY['AI', 'career', 'interview', 'coaching'], false),
('AI Brand Name Generator', 'AI', 'Generates domain-available brand names with logo concepts and taglines', '$1k–$8k MRR', '300k+/mo', 'Steady', 48, 65, 72, '$350M', ARRAY['AI', 'branding', 'startup'], false),
('AI Sales Call Analyzer', 'AI', 'Records and scores sales calls, surfaces winning patterns and objection handling', '$12k–$70k MRR', '8k+/mo', 'Explosive', 87, 36, 92, '$3.8B', ARRAY['AI', 'sales', 'analytics', 'B2B'], true),
('AI Knowledge Base Builder', 'AI', 'Turn Notion/docs into an AI-powered internal Q&A bot for teams', '$7k–$40k MRR', '20k+/mo', 'Rising', 76, 44, 88, '$2.2B', ARRAY['AI', 'knowledge', 'teams', 'productivity'], false),

-- ── SAAS ────────────────────────────────────────────────
('SaaS Churn Prediction Dashboard', 'B2B SaaS', 'ML-driven churn risk scores with automated email intervention sequences', '$10k–$60k MRR', '5k+/mo', 'Rising', 78, 42, 88, '$3.1B', ARRAY['SaaS', 'churn', 'analytics', 'ML'], true),
('No-Code Webhook Builder', 'B2B SaaS', 'Visual drag-and-drop webhook and automation flows without code', '$6k–$35k MRR', '25k+/mo', 'Rising', 72, 48, 85, '$1.9B', ARRAY['SaaS', 'no-code', 'automation', 'webhooks'], false),
('SaaS Subscription Management API', 'B2B SaaS', 'Plug-and-play billing logic with metered usage, trials, and upgrades', '$15k–$100k MRR', '8k+/mo', 'Explosive', 88, 38, 93, '$6.0B', ARRAY['SaaS', 'billing', 'API', 'developer'], true),
('Team OKR Tracking Tool', 'B2B SaaS', 'Simple OKR and goal alignment software for remote-first teams', '$5k–$30k MRR', '15k+/mo', 'Steady', 62, 55, 80, '$1.3B', ARRAY['SaaS', 'OKR', 'HR', 'productivity'], false),
('Customer Feedback Aggregator', 'B2B SaaS', 'Collect, tag, and prioritize product feedback from every channel in one view', '$8k–$45k MRR', '12k+/mo', 'Rising', 75, 46, 87, '$2.0B', ARRAY['SaaS', 'feedback', 'product', 'CX'], false),
('API Monitoring and Alerting SaaS', 'B2B SaaS', 'Uptime and latency monitoring for third-party API dependencies', '$7k–$40k MRR', '10k+/mo', 'Rising', 73, 43, 86, '$1.7B', ARRAY['SaaS', 'API', 'monitoring', 'devops'], true),
('White-Label Client Portal Builder', 'B2B SaaS', 'Agencies build branded portals for client approvals, files, and comms', '$6k–$35k MRR', '20k+/mo', 'Rising', 71, 50, 84, '$1.5B', ARRAY['SaaS', 'agency', 'portal', 'white-label'], false),
('Automated Invoice Reconciliation', 'B2B SaaS', 'Match bank transactions to invoices automatically for SMBs', '$8k–$50k MRR', '8k+/mo', 'Rising', 76, 44, 87, '$2.4B', ARRAY['SaaS', 'finance', 'invoicing', 'automation'], true),
('Employee Pulse Survey Tool', 'B2B SaaS', 'Weekly micro-surveys with AI sentiment analysis for HR teams', '$5k–$28k MRR', '18k+/mo', 'Steady', 64, 52, 79, '$1.1B', ARRAY['SaaS', 'HR', 'surveys', 'engagement'], false),
('Embedded Analytics SDK for SaaS', 'B2B SaaS', 'Drop-in charts and dashboards for SaaS apps without building from scratch', '$12k–$75k MRR', '6k+/mo', 'Explosive', 85, 35, 92, '$4.2B', ARRAY['SaaS', 'analytics', 'SDK', 'developer'], true),
('Internal Wiki Replacement Tool', 'B2B SaaS', 'Faster, AI-searchable alternative to Confluence for engineering teams', '$8k–$45k MRR', '15k+/mo', 'Rising', 73, 47, 86, '$2.1B', ARRAY['SaaS', 'wiki', 'knowledge', 'teams'], false),
('SaaS Feature Flag Manager', 'B2B SaaS', 'Gradual feature rollout with user segmentation and rollback controls', '$7k–$38k MRR', '9k+/mo', 'Rising', 74, 41, 87, '$1.8B', ARRAY['SaaS', 'devtools', 'feature-flags', 'developer'], true),
('Remote Notary Platform', 'B2B SaaS', 'Digital notarization with ID verification for real estate and legal docs', '$9k–$55k MRR', '7k+/mo', 'Rising', 77, 39, 89, '$2.6B', ARRAY['SaaS', 'legal', 'notary', 'fintech'], true),
('Construction Project Management SaaS', 'B2B SaaS', 'Field-first project management for small construction crews', '$8k–$45k MRR', '12k+/mo', 'Rising', 70, 50, 83, '$1.9B', ARRAY['SaaS', 'construction', 'project', 'field'], false),
('Restaurant Inventory Management', 'B2B SaaS', 'Real-time inventory tracking with waste alerts and supplier ordering', '$6k–$32k MRR', '20k+/mo', 'Steady', 67, 54, 80, '$1.4B', ARRAY['SaaS', 'restaurant', 'inventory', 'food'], false),

-- ── HEALTH ──────────────────────────────────────────────
('AI Symptom Checker App', 'Health', 'Evidence-based symptom triage with specialist referral routing', '$5k–$30k MRR', '500k+/mo', 'Rising', 74, 58, 84, '$8.0B', ARRAY['health', 'AI', 'symptoms', 'triage'], false),
('Personalized Supplement Recommender', 'Health', 'Blood test + lifestyle quiz → personalized supplement stack subscription', '$8k–$50k MRR', '200k+/mo', 'Explosive', 82, 48, 89, '$5.5B', ARRAY['health', 'supplements', 'personalization', 'DTC'], true),
('Mental Health Journaling App', 'Health', 'CBT-structured daily journaling with mood tracking and AI insights', '$3k–$18k MRR', '1M+/mo', 'Rising', 70, 62, 82, '$4.2B', ARRAY['health', 'mental-health', 'journaling', 'CBT'], false),
('Remote Physical Therapy Platform', 'Health', 'Video-guided exercise programs prescribed by licensed PTs', '$10k–$65k MRR', '100k+/mo', 'Rising', 78, 45, 88, '$6.8B', ARRAY['health', 'physio', 'telehealth', 'rehab'], true),
('AI Diet Coach App', 'Health', 'Photo-based meal logging with macro tracking and AI coaching', '$4k–$22k MRR', '2M+/mo', 'Explosive', 84, 55, 88, '$3.8B', ARRAY['health', 'diet', 'nutrition', 'AI'], false),
('Sleep Optimization App', 'Health', 'Wearable-connected sleep analytics with personalized improvement plans', '$5k–$28k MRR', '800k+/mo', 'Rising', 76, 52, 86, '$4.5B', ARRAY['health', 'sleep', 'wearable', 'analytics'], false),
('Period and Fertility Tracker', 'Health', 'AI cycle prediction with conception optimization for women', '$3k–$16k MRR', '3M+/mo', 'Steady', 60, 70, 77, '$2.9B', ARRAY['health', 'fertility', 'women', 'tracking'], false),
('Chronic Pain Management App', 'Health', 'Daily tracking, biofeedback, and CBT exercises for chronic pain sufferers', '$4k–$24k MRR', '400k+/mo', 'Rising', 73, 44, 85, '$5.1B', ARRAY['health', 'chronic-pain', 'biofeedback', 'CBT'], true),
('ADHD Productivity App', 'Health', 'Body-doubling, task chunking, and dopamine-based reward loops for ADHD adults', '$3k–$20k MRR', '600k+/mo', 'Explosive', 81, 50, 89, '$3.3B', ARRAY['health', 'ADHD', 'productivity', 'neurodiversity'], true),
('Meditation and Breathwork App', 'Health', 'Science-backed breathwork protocols for stress, focus, and sleep', '$4k–$25k MRR', '1.5M+/mo', 'Steady', 65, 72, 78, '$3.0B', ARRAY['health', 'meditation', 'breathwork', 'mindfulness'], false),
('AI Personal Trainer App', 'Health', 'Form-correcting workout plans with AI camera analysis via phone', '$5k–$30k MRR', '1.2M+/mo', 'Explosive', 83, 58, 87, '$4.0B', ARRAY['health', 'fitness', 'AI', 'personal-trainer'], false),
('Gut Health Test and Coach App', 'Health', 'At-home microbiome test kit paired with AI dietary recommendations', '$12k–$70k MRR', '50k+/mo', 'Rising', 79, 42, 90, '$6.2B', ARRAY['health', 'gut', 'microbiome', 'DTC'], true),
('Telehealth for Menopause', 'Health', 'HRT prescriptions, labs, and coaching for women in perimenopause', '$15k–$90k MRR', '80k+/mo', 'Explosive', 88, 35, 94, '$7.5B', ARRAY['health', 'menopause', 'telehealth', 'women'], true),
('Corporate Wellness Platform', 'Health', 'Employee health challenges, step contests, and wellbeing scores for HR', '$8k–$50k MRR', '20k+/mo', 'Rising', 72, 48, 85, '$3.5B', ARRAY['health', 'corporate', 'wellness', 'HR'], false),
('Addiction Recovery Support App', 'Health', 'Peer support, sobriety tracking, and cravings journaling for recovery', '$2k–$12k MRR', '300k+/mo', 'Rising', 68, 42, 83, '$2.8B', ARRAY['health', 'addiction', 'recovery', 'mental-health'], true),

-- ── EDUCATION ───────────────────────────────────────────
('AI Homework Helper for K-12', 'Education', 'Step-by-step explanations without giving direct answers, Socratic method', '$3k–$15k MRR', '2M+/mo', 'Rising', 72, 62, 81, '$4.5B', ARRAY['education', 'AI', 'K12', 'homework'], false),
('Coding Bootcamp in a Box', 'Education', 'Self-paced full-stack curriculum with AI mentoring and project reviews', '$8k–$45k MRR', '50k+/mo', 'Rising', 74, 52, 85, '$3.2B', ARRAY['education', 'coding', 'bootcamp', 'AI'], false),
('Language Learning with AI Conversation', 'Education', 'Real-time AI conversation partner that adapts to your level and goals', '$4k–$22k MRR', '1M+/mo', 'Explosive', 80, 65, 85, '$6.0B', ARRAY['education', 'language', 'AI', 'conversation'], false),
('Flashcard App with Spaced Repetition AI', 'Education', 'Auto-generates flashcards from any text, optimizes review schedules', '$2k–$10k MRR', '3M+/mo', 'Rising', 66, 68, 79, '$2.1B', ARRAY['education', 'flashcards', 'spaced-repetition', 'AI'], false),
('Online Exam Prep Platform', 'Education', 'AI-adaptive practice tests for SAT, GMAT, bar exam, and medical boards', '$6k–$35k MRR', '400k+/mo', 'Rising', 73, 55, 84, '$3.8B', ARRAY['education', 'exam', 'prep', 'AI'], false),
('Teacher Lesson Plan Generator', 'Education', 'AI that creates differentiated lesson plans aligned to curriculum standards', '$4k–$24k MRR', '100k+/mo', 'Rising', 75, 45, 87, '$2.5B', ARRAY['education', 'teacher', 'lesson-plan', 'AI'], true),
('Corporate LMS with AI Coach', 'Education', 'Employee training platform with AI coaching and skill gap analysis', '$10k–$65k MRR', '30k+/mo', 'Rising', 78, 48, 88, '$5.5B', ARRAY['education', 'corporate', 'LMS', 'AI'], true),
('Kids Coding Game', 'Education', 'Game-based coding education for ages 6–12 covering Python and Scratch', '$3k–$18k MRR', '500k+/mo', 'Steady', 62, 60, 78, '$2.0B', ARRAY['education', 'kids', 'coding', 'gamification'], false),
('Academic Paper Summarizer', 'Education', 'Translate dense research papers into plain-English summaries and key points', '$2k–$12k MRR', '800k+/mo', 'Rising', 68, 55, 81, '$1.4B', ARRAY['education', 'research', 'AI', 'summarizer'], false),
('1-on-1 Tutoring Marketplace', 'Education', 'Vetted live tutors with AI-matched subject expertise and availability', '$15k–$80k MRR', '200k+/mo', 'Steady', 65, 62, 80, '$7.8B', ARRAY['education', 'tutoring', 'marketplace', 'online'], false),
('Micro-Credential Platform for Professionals', 'Education', 'Short certifications in AI, data, and leadership with employer partnerships', '$8k–$50k MRR', '80k+/mo', 'Rising', 76, 50, 87, '$4.1B', ARRAY['education', 'certification', 'professional', 'upskilling'], true),
('Student Focus App with Pomodoro AI', 'Education', 'Smart study timer with distraction blocking and productivity analytics', '$2k–$10k MRR', '1.5M+/mo', 'Steady', 60, 65, 76, '$900M', ARRAY['education', 'focus', 'pomodoro', 'productivity'], false),

-- ── PRODUCTIVITY ────────────────────────────────────────
('AI Task Prioritization App', 'Productivity', 'Ranks your to-do list by impact, energy, and deadlines using context', '$3k–$18k MRR', '500k+/mo', 'Rising', 72, 58, 83, '$2.0B', ARRAY['productivity', 'tasks', 'AI', 'priority'], false),
('Second Brain App for Knowledge Workers', 'Productivity', 'Capture, link, and retrieve ideas with AI summarization and retrieval', '$5k–$28k MRR', '200k+/mo', 'Rising', 74, 55, 85, '$1.8B', ARRAY['productivity', 'PKM', 'knowledge', 'AI'], false),
('AI Email Triage and Prioritization', 'Productivity', 'Sorts inbox by urgency, drafts replies, and unsubscribes junk', '$4k–$20k MRR', '300k+/mo', 'Rising', 71, 60, 82, '$1.5B', ARRAY['productivity', 'email', 'AI', 'inbox'], false),
('Async Video Messaging for Teams', 'Productivity', 'Loom alternative with AI transcripts, summaries, and reactions', '$6k–$38k MRR', '80k+/mo', 'Rising', 75, 52, 86, '$2.3B', ARRAY['productivity', 'video', 'async', 'teams'], false),
('Smart Calendar Scheduler AI', 'Productivity', 'AI that auto-books meetings in optimal time blocks based on energy patterns', '$5k–$30k MRR', '200k+/mo', 'Rising', 73, 56, 84, '$1.9B', ARRAY['productivity', 'calendar', 'AI', 'scheduling'], false),
('Browser Extension for Deep Work', 'Productivity', 'Distraction blocker with focus scores, sessions, and weekly reports', '$1k–$6k MRR', '2M+/mo', 'Steady', 55, 68, 74, '$500M', ARRAY['productivity', 'focus', 'extension', 'deep-work'], false),
('AI Writing Assistant for Developers', 'Productivity', 'Writes commit messages, PR descriptions, and technical docs from diffs', '$4k–$22k MRR', '400k+/mo', 'Rising', 76, 48, 87, '$1.7B', ARRAY['productivity', 'developer', 'writing', 'AI'], true),
('Meeting Prep Briefing Generator', 'Productivity', 'Pulls CRM, email, and LinkedIn data to create pre-meeting briefs', '$7k–$42k MRR', '40k+/mo', 'Rising', 78, 44, 89, '$2.5B', ARRAY['productivity', 'meetings', 'AI', 'CRM'], true),
('Clipboard History Manager with AI Search', 'Productivity', 'Searchable clipboard history with AI tagging and snippet organization', '$1k–$5k MRR', '800k+/mo', 'Steady', 52, 60, 72, '$400M', ARRAY['productivity', 'clipboard', 'search', 'utility'], false),
('Automated Status Update Generator', 'Productivity', 'Pulls activity from Jira/GitHub/Linear to write weekly team standup updates', '$5k–$28k MRR', '60k+/mo', 'Rising', 74, 46, 86, '$1.6B', ARRAY['productivity', 'standup', 'automation', 'teams'], true),

-- ── CONSUMER ────────────────────────────────────────────
('AI Wardrobe Stylist App', 'Consumer', 'Photo your wardrobe, get daily outfit suggestions based on weather and calendar', '$3k–$16k MRR', '800k+/mo', 'Rising', 68, 55, 81, '$2.5B', ARRAY['consumer', 'fashion', 'AI', 'style'], false),
('AI Trip Planner', 'Consumer', 'Personalized day-by-day itineraries with real-time pricing and bookings', '$4k–$20k MRR', '2M+/mo', 'Explosive', 78, 62, 84, '$5.5B', ARRAY['consumer', 'travel', 'AI', 'planning'], false),
('AI Recipe Generator from Fridge Contents', 'Consumer', 'Snap your fridge, get recipes for what you have with shopping gap lists', '$2k–$10k MRR', '1.5M+/mo', 'Rising', 66, 60, 79, '$1.8B', ARRAY['consumer', 'food', 'AI', 'recipes'], false),
('Personal Finance Coaching App', 'Consumer', 'AI financial coach that analyzes spending and creates savings plans', '$3k–$18k MRR', '1M+/mo', 'Rising', 70, 62, 82, '$3.8B', ARRAY['consumer', 'finance', 'coaching', 'AI'], false),
('Pet Health and Vet Finder App', 'Consumer', 'Symptom checker, vet booking, vaccination reminders, and pet insurance', '$4k–$22k MRR', '600k+/mo', 'Rising', 72, 52, 84, '$3.0B', ARRAY['consumer', 'pets', 'health', 'marketplace'], true),
('Local Experience Marketplace', 'Consumer', 'Book unique local experiences: cooking classes, tours, artisan workshops', '$8k–$45k MRR', '300k+/mo', 'Steady', 65, 60, 79, '$4.2B', ARRAY['consumer', 'experiences', 'marketplace', 'local'], false),
('Book Summary and Learning App', 'Consumer', 'AI summaries and audio versions of the top business and self-help books', '$3k–$18k MRR', '1M+/mo', 'Rising', 68, 65, 80, '$2.2B', ARRAY['consumer', 'books', 'learning', 'audio'], false),
('Group Gift Coordinator App', 'Consumer', 'Coordinate group gifts with split payments, wish list syncing, and tracking', '$1k–$5k MRR', '500k+/mo', 'Steady', 50, 58, 71, '$600M', ARRAY['consumer', 'gifts', 'social', 'payments'], false),
('AI Date Night Planner', 'Consumer', 'Personalized date ideas based on location, budget, and partner interests', '$1k–$6k MRR', '400k+/mo', 'Steady', 52, 55, 72, '$500M', ARRAY['consumer', 'dating', 'AI', 'lifestyle'], false),
('Home Renovation Cost Estimator', 'Consumer', 'Photo-based room scan produces itemized renovation cost estimates', '$3k–$16k MRR', '800k+/mo', 'Rising', 69, 50, 83, '$1.9B', ARRAY['consumer', 'home', 'renovation', 'AI'], true),
('Car Maintenance Tracker App', 'Consumer', 'Service reminders, cost tracker, and mechanic finder based on your vehicle', '$2k–$10k MRR', '1M+/mo', 'Steady', 58, 55, 76, '$1.3B', ARRAY['consumer', 'auto', 'maintenance', 'tracker'], false),
('Secondhand Luxury Authentication App', 'Consumer', 'AI authentication for luxury goods before resale transactions', '$5k–$30k MRR', '200k+/mo', 'Rising', 74, 45, 87, '$3.5B', ARRAY['consumer', 'luxury', 'authentication', 'resale'], true),

-- ── FINANCE ─────────────────────────────────────────────
('Crypto Tax Calculator', 'Finance', 'Auto-import transactions from 50+ wallets and exchanges, generate tax forms', '$8k–$50k MRR', '200k+/mo', 'Explosive', 82, 55, 87, '$4.0B', ARRAY['finance', 'crypto', 'tax', 'compliance'], false),
('Stock Screener with AI Signals', 'Finance', 'Technical + fundamental screening with AI-generated buy/sell signals', '$6k–$35k MRR', '150k+/mo', 'Rising', 74, 58, 84, '$3.2B', ARRAY['finance', 'stocks', 'AI', 'trading'], false),
('Expense Management for Freelancers', 'Finance', 'Receipt scanning, category tagging, and quarterly tax estimation', '$3k–$18k MRR', '500k+/mo', 'Steady', 65, 60, 79, '$2.1B', ARRAY['finance', 'freelance', 'expense', 'tax'], false),
('AI Financial Advisor for Millennials', 'Finance', 'Plain-English investment guidance with goal-based portfolio suggestions', '$5k–$28k MRR', '300k+/mo', 'Rising', 72, 55, 83, '$5.5B', ARRAY['finance', 'investment', 'AI', 'advisor'], false),
('SMB Cash Flow Forecasting Tool', 'Finance', 'Connects to bank accounts and predicts cash flow 90 days ahead', '$8k–$48k MRR', '30k+/mo', 'Rising', 76, 44, 88, '$3.8B', ARRAY['finance', 'SMB', 'cashflow', 'forecasting'], true),
('Equity Management for Startups', 'Finance', 'Cap table management, 409A valuations, and option grant tracking', '$10k–$65k MRR', '10k+/mo', 'Rising', 78, 42, 89, '$4.5B', ARRAY['finance', 'equity', 'cap-table', 'startup'], true),
('Personal Net Worth Tracker', 'Finance', 'Aggregates all accounts, assets, and debts into a single net worth dashboard', '$2k–$10k MRR', '600k+/mo', 'Steady', 58, 65, 76, '$1.2B', ARRAY['finance', 'net-worth', 'tracking', 'personal'], false),
('Invoice Financing Marketplace', 'Finance', 'SMBs sell unpaid invoices to investors for immediate working capital', '$20k–$150k MRR', '5k+/mo', 'Rising', 80, 38, 91, '$8.5B', ARRAY['finance', 'invoicing', 'marketplace', 'fintech'], true),
('Robo-Advisor for ESG Investing', 'Finance', 'Automated ESG portfolio with transparent impact metrics and tax-loss harvesting', '$6k–$38k MRR', '80k+/mo', 'Rising', 73, 50, 85, '$6.0B', ARRAY['finance', 'ESG', 'robo-advisor', 'sustainable'], true),
('Payroll Automation for Small Businesses', 'Finance', 'One-click payroll with tax filing, direct deposit, and contractor payments', '$8k–$50k MRR', '15k+/mo', 'Steady', 70, 52, 83, '$3.5B', ARRAY['finance', 'payroll', 'SMB', 'automation'], false),

-- ── AI APPS (VERTICAL) ──────────────────────────────────
('AI Real Estate Listing Writer', 'AI', 'Generates MLS descriptions from photos and property details in seconds', '$3k–$18k MRR', '50k+/mo', 'Rising', 68, 48, 82, '$900M', ARRAY['AI', 'real-estate', 'content', 'listing'], true),
('AI Customer Support Agent Builder', 'AI', 'No-code platform to build, train, and deploy AI support agents on any channel', '$12k–$75k MRR', '15k+/mo', 'Explosive', 88, 40, 93, '$7.2B', ARRAY['AI', 'customer-support', 'no-code', 'agent'], true),
('AI SEO Content Brief Generator', 'AI', 'Analyzes SERPs and creates structured content briefs that rank', '$5k–$30k MRR', '80k+/mo', 'Rising', 73, 55, 84, '$1.6B', ARRAY['AI', 'SEO', 'content', 'marketing'], false),
('AI Legal Document Drafter', 'AI', 'Generates NDAs, SOWs, employment contracts from plain-English descriptions', '$8k–$55k MRR', '20k+/mo', 'Rising', 77, 42, 89, '$5.0B', ARRAY['AI', 'legal', 'documents', 'contracts'], true),
('AI Grant Writer for Nonprofits', 'AI', 'Researches matching grants and writes tailored applications for nonprofits', '$4k–$24k MRR', '10k+/mo', 'Rising', 74, 35, 88, '$1.8B', ARRAY['AI', 'nonprofit', 'grants', 'writing'], true),
('AI Podcast Repurposing Tool', 'AI', 'Converts podcast episodes into blog posts, social clips, and newsletters', '$3k–$20k MRR', '100k+/mo', 'Rising', 70, 52, 83, '$1.2B', ARRAY['AI', 'podcast', 'repurposing', 'content'], false),
('AI Performance Review Generator', 'AI', 'Writes structured, bias-reduced performance reviews from manager notes', '$5k–$30k MRR', '30k+/mo', 'Rising', 72, 44, 85, '$1.5B', ARRAY['AI', 'HR', 'performance', 'reviews'], true),
('AI Interior Design App', 'AI', 'Upload room photo, get redesign concepts in different styles instantly', '$4k–$22k MRR', '500k+/mo', 'Rising', 71, 58, 82, '$2.8B', ARRAY['AI', 'interior-design', 'AR', 'consumer'], false),
('AI YouTube Script Writer', 'AI', 'Research-backed video scripts with hooks, retention loops, and CTAs', '$3k–$16k MRR', '200k+/mo', 'Rising', 68, 60, 80, '$1.1B', ARRAY['AI', 'YouTube', 'script', 'content'], false),
('AI Pitch Deck Generator', 'AI', 'Creates investor-ready pitch decks from a product brief and metrics', '$5k–$32k MRR', '30k+/mo', 'Explosive', 80, 45, 90, '$2.0B', ARRAY['AI', 'pitch-deck', 'startup', 'fundraising'], true),
('AI Onboarding Email Sequence Writer', 'AI', 'Personalized onboarding email flows based on user actions and segments', '$4k–$22k MRR', '40k+/mo', 'Rising', 72, 48, 84, '$1.3B', ARRAY['AI', 'email', 'onboarding', 'SaaS'], false),
('AI Product Roadmap Prioritizer', 'AI', 'Scores feature requests by revenue impact, effort, and strategic fit', '$7k–$42k MRR', '15k+/mo', 'Rising', 75, 43, 87, '$2.2B', ARRAY['AI', 'product', 'roadmap', 'prioritization'], true),

-- ── DEVELOPER TOOLS ─────────────────────────────────────
('AI Code Review Assistant', 'AI', 'Reviews PRs for security, performance, and style in your CI pipeline', '$8k–$50k MRR', '100k+/mo', 'Explosive', 85, 42, 92, '$3.5B', ARRAY['developer', 'AI', 'code-review', 'devtools'], true),
('No-Code Internal Tool Builder', 'B2B SaaS', 'Drag-and-drop CRUD interfaces connected to any database in minutes', '$10k–$65k MRR', '25k+/mo', 'Explosive', 86, 40, 93, '$4.8B', ARRAY['developer', 'no-code', 'internal-tools', 'SaaS'], true),
('Developer Documentation Generator', 'AI', 'Auto-generates API docs, README files, and changelogs from code', '$5k–$28k MRR', '80k+/mo', 'Rising', 74, 46, 86, '$1.6B', ARRAY['developer', 'AI', 'docs', 'API'], false),
('CI/CD Pipeline Optimizer', 'B2B SaaS', 'AI analysis of build pipelines to reduce test times and flakiness', '$8k–$48k MRR', '15k+/mo', 'Rising', 76, 44, 87, '$2.0B', ARRAY['developer', 'CI/CD', 'devops', 'AI'], true),
('Database Schema Designer AI', 'AI', 'Natural language to normalized database schema with migration scripts', '$4k–$22k MRR', '50k+/mo', 'Rising', 72, 48, 84, '$1.4B', ARRAY['developer', 'AI', 'database', 'schema'], false),
('Error Monitoring and Root Cause AI', 'B2B SaaS', 'Groups production errors by root cause and suggests fixes with context', '$10k–$60k MRR', '20k+/mo', 'Rising', 78, 45, 88, '$2.5B', ARRAY['developer', 'monitoring', 'AI', 'errors'], true),
('Infrastructure Cost Optimizer', 'B2B SaaS', 'Identifies wasteful cloud spend and rightsizes resources automatically', '$12k–$80k MRR', '8k+/mo', 'Explosive', 85, 38, 93, '$5.8B', ARRAY['developer', 'cloud', 'cost', 'devops'], true),
('AI Test Case Generator', 'AI', 'Generates comprehensive unit and integration tests from function signatures', '$5k–$30k MRR', '60k+/mo', 'Rising', 73, 45, 86, '$1.9B', ARRAY['developer', 'AI', 'testing', 'QA'], false),
('Localhost Tunneling SaaS', 'B2B SaaS', 'Expose local dev servers to the internet with custom domains and auth', '$3k–$15k MRR', '200k+/mo', 'Steady', 65, 55, 78, '$800M', ARRAY['developer', 'tunneling', 'devtools', 'networking'], false),
('API Design and Mock Server', 'B2B SaaS', 'Design REST/GraphQL APIs visually and generate mock servers instantly', '$4k–$22k MRR', '40k+/mo', 'Rising', 70, 50, 82, '$1.3B', ARRAY['developer', 'API', 'mock', 'design'], false),

-- ── MARKETING ───────────────────────────────────────────
('AI Ad Creative Generator', 'AI', 'Generates Facebook, Google, and TikTok ad variants from a brief', '$6k–$38k MRR', '100k+/mo', 'Explosive', 82, 55, 87, '$4.5B', ARRAY['marketing', 'ads', 'AI', 'creative'], false),
('AI Landing Page Optimizer', 'AI', 'A/B tests headlines, CTAs, and layouts using AI-generated variants', '$7k–$42k MRR', '30k+/mo', 'Rising', 76, 50, 87, '$2.8B', ARRAY['marketing', 'landing-page', 'CRO', 'AI'], true),
('Influencer Outreach Automation', 'B2B SaaS', 'Finds relevant micro-influencers and automates personalized outreach at scale', '$8k–$48k MRR', '20k+/mo', 'Rising', 75, 52, 85, '$3.0B', ARRAY['marketing', 'influencer', 'outreach', 'automation'], false),
('Email List Growth Tool', 'B2B SaaS', 'Exit-intent popups, lead magnets, and A/B tested opt-in forms with analytics', '$4k–$22k MRR', '50k+/mo', 'Steady', 65, 60, 78, '$1.5B', ARRAY['marketing', 'email', 'lead-gen', 'growth'], false),
('AI Copywriting Tool for Ads', 'AI', 'Writes high-converting ad copy for PPC with headline variants and CTAs', '$5k–$28k MRR', '150k+/mo', 'Rising', 72, 62, 82, '$2.0B', ARRAY['marketing', 'AI', 'copywriting', 'ads'], false),
('Video Ad Creator for Social', 'B2B SaaS', 'Drag-drop video ad builder with AI script, voiceover, and stock footage', '$5k–$30k MRR', '80k+/mo', 'Rising', 71, 58, 82, '$2.5B', ARRAY['marketing', 'video', 'ads', 'social'], false),
('Referral Program Builder', 'B2B SaaS', 'No-code referral campaigns with reward management and fraud detection', '$6k–$35k MRR', '25k+/mo', 'Rising', 73, 48, 85, '$1.8B', ARRAY['marketing', 'referral', 'growth', 'no-code'], true),
('Review Automation for Local Business', 'B2B SaaS', 'Automated post-visit SMS requests Google/Yelp reviews from customers', '$3k–$18k MRR', '40k+/mo', 'Steady', 64, 55, 78, '$1.1B', ARRAY['marketing', 'reviews', 'local', 'SMB'], false),
('AI Newsletter Writer', 'AI', 'Researches topics and writes branded newsletters with one-click send', '$3k–$16k MRR', '80k+/mo', 'Rising', 68, 55, 80, '$1.0B', ARRAY['marketing', 'AI', 'newsletter', 'content'], false),
('Affiliate Marketing Management Platform', 'B2B SaaS', 'Recruit, track, and pay affiliates with fraud detection and analytics', '$8k–$50k MRR', '15k+/mo', 'Rising', 74, 48, 86, '$3.2B', ARRAY['marketing', 'affiliate', 'SaaS', 'tracking'], true),

-- ── HR & TALENT ─────────────────────────────────────────
('AI Job Description Writer', 'AI', 'Generates inclusive, optimized JDs that attract 2× more qualified applicants', '$4k–$22k MRR', '50k+/mo', 'Rising', 72, 48, 84, '$1.3B', ARRAY['HR', 'AI', 'recruiting', 'JD'], false),
('Technical Interview Platform', 'B2B SaaS', 'Live coding assessments with AI evaluation and plagiarism detection', '$10k–$60k MRR', '20k+/mo', 'Rising', 78, 46, 88, '$2.8B', ARRAY['HR', 'interview', 'coding', 'assessment'], true),
('Async Video Interview Tool', 'B2B SaaS', 'Candidates record answers; AI analyzes communication and confidence', '$7k–$40k MRR', '15k+/mo', 'Rising', 74, 50, 85, '$2.0B', ARRAY['HR', 'interview', 'video', 'async'], false),
('Employee Onboarding Automation', 'B2B SaaS', 'Automated HR workflows: offer letters, equipment ordering, account provisioning', '$8k–$48k MRR', '12k+/mo', 'Rising', 76, 44, 87, '$2.5B', ARRAY['HR', 'onboarding', 'automation', 'SaaS'], true),
('Freelancer Management System', 'B2B SaaS', 'Contract management, time tracking, and payments for contractor-heavy teams', '$7k–$42k MRR', '20k+/mo', 'Rising', 72, 50, 84, '$2.2B', ARRAY['HR', 'freelance', 'contractors', 'management'], false),
('AI Salary Benchmarking Tool', 'AI', 'Real-time comp data by role, location, and company stage for hiring teams', '$8k–$50k MRR', '15k+/mo', 'Rising', 75, 44, 87, '$1.9B', ARRAY['HR', 'AI', 'salary', 'compensation'], true),
('Skills Assessment Platform', 'B2B SaaS', 'Pre-hire skill tests with AI-adaptive questions and benchmark scoring', '$8k–$48k MRR', '25k+/mo', 'Rising', 74, 48, 86, '$2.4B', ARRAY['HR', 'skills', 'assessment', 'hiring'], false),

-- ── E-COMMERCE ──────────────────────────────────────────
('AI Product Recommendation Engine', 'Consumer', 'Personalized product recommendations via embeddable widget for any store', '$8k–$50k MRR', '20k+/mo', 'Rising', 76, 52, 86, '$4.5B', ARRAY['ecommerce', 'AI', 'recommendations', 'personalization'], true),
('Dropshipping Supplier Finder', 'B2B SaaS', 'Vetted supplier directory with product trend scores and margin calculators', '$3k–$18k MRR', '100k+/mo', 'Steady', 62, 62, 77, '$2.0B', ARRAY['ecommerce', 'dropshipping', 'supplier', 'marketplace'], false),
('Headless Commerce Storefront Builder', 'B2B SaaS', 'Next.js + Shopify headless storefront builder with design templates', '$8k–$50k MRR', '10k+/mo', 'Rising', 74, 48, 85, '$3.0B', ARRAY['ecommerce', 'headless', 'Shopify', 'developer'], false),
('Returns Management Automation', 'B2B SaaS', 'Self-service returns portal with AI routing to repair, resell, or recycle', '$6k–$38k MRR', '15k+/mo', 'Rising', 73, 46, 85, '$2.8B', ARRAY['ecommerce', 'returns', 'automation', 'logistics'], true),
('Social Commerce Tool for Instagram', 'B2B SaaS', 'Tag products in Instagram posts and stories with direct checkout links', '$4k–$22k MRR', '30k+/mo', 'Rising', 70, 55, 82, '$2.5B', ARRAY['ecommerce', 'social', 'Instagram', 'commerce'], false),
('AI Pricing Optimizer for E-commerce', 'AI', 'Dynamic pricing based on competitor prices, demand, and inventory levels', '$8k–$50k MRR', '12k+/mo', 'Rising', 76, 44, 88, '$3.2B', ARRAY['ecommerce', 'AI', 'pricing', 'dynamic'], true),
('Subscription Box Management Platform', 'B2B SaaS', 'End-to-end platform for curated subscription boxes: orders, billing, logistics', '$8k–$48k MRR', '8k+/mo', 'Rising', 72, 50, 84, '$2.0B', ARRAY['ecommerce', 'subscription', 'box', 'DTC'], false),
('Live Shopping Platform', 'Consumer', 'TikTok Shop-style live stream selling for DTC brands and boutiques', '$10k–$65k MRR', '50k+/mo', 'Explosive', 84, 48, 90, '$6.5B', ARRAY['ecommerce', 'live-shopping', 'DTC', 'video'], true),

-- ── REAL ESTATE & PROPTECH ──────────────────────────────
('AI Home Valuation Tool', 'AI', 'Instant AVM with confidence scores for buyers, sellers, and lenders', '$6k–$38k MRR', '300k+/mo', 'Rising', 74, 54, 84, '$3.5B', ARRAY['real-estate', 'AI', 'valuation', 'proptech'], false),
('Short-Term Rental Management Software', 'B2B SaaS', 'Unified dashboard for Airbnb/VRBO/Booking.com with dynamic pricing', '$10k–$65k MRR', '20k+/mo', 'Rising', 78, 48, 87, '$4.0B', ARRAY['real-estate', 'STR', 'Airbnb', 'SaaS'], true),
('Commercial Real Estate Analytics', 'B2B SaaS', 'Market data, comp analysis, and deal scoring for CRE investors', '$15k–$100k MRR', '5k+/mo', 'Rising', 80, 40, 91, '$6.5B', ARRAY['real-estate', 'CRE', 'analytics', 'investment'], true),
('Property Management Automation', 'B2B SaaS', 'Maintenance requests, rent collection, and tenant comms for landlords', '$6k–$38k MRR', '15k+/mo', 'Steady', 68, 55, 80, '$3.0B', ARRAY['real-estate', 'property-management', 'automation', 'landlord'], false),
('AI Mortgage Pre-qualification Tool', 'AI', 'Instant pre-qualification scores with rate comparison for buyers', '$8k–$50k MRR', '200k+/mo', 'Rising', 76, 48, 87, '$5.5B', ARRAY['real-estate', 'mortgage', 'AI', 'fintech'], true),

-- ── LEGAL TECH ──────────────────────────────────────────
('AI Trademark Search Tool', 'AI', 'Search USPTO and international databases with AI conflict scoring', '$5k–$30k MRR', '30k+/mo', 'Rising', 74, 42, 87, '$1.8B', ARRAY['legal', 'AI', 'trademark', 'IP'], true),
('Contract Lifecycle Management', 'B2B SaaS', 'Create, negotiate, sign, and store contracts with AI clause analysis', '$12k–$80k MRR', '10k+/mo', 'Rising', 78, 44, 88, '$5.5B', ARRAY['legal', 'contracts', 'CLM', 'SaaS'], true),
('AI Privacy Policy Generator', 'AI', 'Generates GDPR/CCPA-compliant privacy policies from site details', '$2k–$10k MRR', '200k+/mo', 'Steady', 60, 60, 76, '$700M', ARRAY['legal', 'AI', 'privacy', 'compliance'], false),
('Court Filing Automation', 'B2B SaaS', 'Automates e-filing for law firms: form population, deadline tracking, confirmation', '$10k–$65k MRR', '5k+/mo', 'Rising', 76, 38, 89, '$3.8B', ARRAY['legal', 'court', 'filing', 'automation'], true),
('AI Due Diligence Assistant', 'AI', 'Analyzes deal documents and flags key risks for M&A transactions', '$20k–$120k MRR', '3k+/mo', 'Explosive', 88, 32, 94, '$8.0B', ARRAY['legal', 'AI', 'due-diligence', 'M&A'], true),

-- ── LOGISTICS & OPS ─────────────────────────────────────
('Last-Mile Delivery Optimizer', 'B2B SaaS', 'Route optimization for local couriers and food delivery fleets', '$8k–$50k MRR', '5k+/mo', 'Rising', 74, 50, 84, '$5.0B', ARRAY['logistics', 'delivery', 'routing', 'optimization'], false),
('Inventory Forecasting AI', 'B2B SaaS', 'Predicts stockouts and overstock situations 30–90 days in advance', '$10k–$65k MRR', '8k+/mo', 'Rising', 78, 44, 89, '$3.8B', ARRAY['logistics', 'inventory', 'AI', 'forecasting'], true),
('Freight Quote Aggregator', 'B2B SaaS', 'Instant freight quotes from 50+ carriers with booking and tracking', '$8k–$50k MRR', '10k+/mo', 'Rising', 74, 48, 85, '$4.5B', ARRAY['logistics', 'freight', 'shipping', 'marketplace'], false),
('Field Service Management App', 'B2B SaaS', 'Scheduling, dispatch, and invoicing for HVAC, plumbing, and electrical crews', '$8k–$48k MRR', '12k+/mo', 'Steady', 70, 52, 82, '$2.8B', ARRAY['logistics', 'field-service', 'scheduling', 'SMB'], false),
('Warehouse Management System for SMBs', 'B2B SaaS', 'Pick-pack-ship workflows with barcode scanning and carrier integrations', '$8k–$50k MRR', '5k+/mo', 'Steady', 68, 50, 81, '$3.2B', ARRAY['logistics', 'warehouse', 'WMS', 'SMB'], false),

-- ── CREATOR ECONOMY ─────────────────────────────────────
('Newsletter Monetization Platform', 'Consumer', 'Paid newsletter subscriptions with referral programs and analytics', '$4k–$22k MRR', '50k+/mo', 'Rising', 70, 58, 82, '$2.5B', ARRAY['creator', 'newsletter', 'monetization', 'subscriptions'], false),
('Digital Product Marketplace for Creators', 'Consumer', 'Sell templates, presets, courses, and ebooks with instant delivery', '$5k–$30k MRR', '80k+/mo', 'Rising', 72, 58, 83, '$3.2B', ARRAY['creator', 'digital-products', 'marketplace', 'courses'], false),
('AI Thumbnail Generator for YouTube', 'AI', 'A/B testable YouTube thumbnails from title and video description', '$2k–$12k MRR', '500k+/mo', 'Rising', 68, 58, 80, '$900M', ARRAY['creator', 'AI', 'YouTube', 'thumbnails'], false),
('Coaching Platform with AI Session Notes', 'B2B SaaS', 'Session booking, AI-transcribed notes, and progress tracking for coaches', '$5k–$30k MRR', '20k+/mo', 'Rising', 72, 48, 84, '$2.2B', ARRAY['creator', 'coaching', 'AI', 'sessions'], true),
('Community Platform for Paid Groups', 'Consumer', 'Discord alternative with gated access, events, and courses', '$6k–$38k MRR', '30k+/mo', 'Rising', 71, 56, 83, '$3.0B', ARRAY['creator', 'community', 'paid', 'platform'], false),
('AI Short-Form Video Editor', 'AI', 'Auto-edits long-form video into TikTok/Reels clips with captions', '$4k–$22k MRR', '600k+/mo', 'Explosive', 80, 60, 86, '$3.8B', ARRAY['creator', 'AI', 'video', 'editing'], false),
('Merchandise Fulfillment for Creators', 'Consumer', 'Print-on-demand merchandise with creator storefront and fan analytics', '$3k–$18k MRR', '100k+/mo', 'Steady', 62, 65, 76, '$2.0B', ARRAY['creator', 'merchandise', 'POD', 'ecommerce'], false),
('AI Audio Enhancer for Podcasters', 'AI', 'One-click noise removal, EQ, and mastering for podcast audio files', '$2k–$10k MRR', '200k+/mo', 'Rising', 66, 55, 79, '$700M', ARRAY['creator', 'AI', 'audio', 'podcast'], false),

-- ── PROPTECH / INSURANCE ────────────────────────────────
('Embedded Insurance for Gig Workers', 'Finance', 'Per-trip micro-insurance for Uber/DoorDash/Instacart gig workers', '$15k–$100k MRR', '200k+/mo', 'Explosive', 85, 38, 93, '$8.5B', ARRAY['insurance', 'gig', 'embedded', 'fintech'], true),
('AI Insurance Claim Processor', 'AI', 'Automates claim intake, document review, and fraud detection for insurers', '$20k–$120k MRR', '2k+/mo', 'Explosive', 87, 35, 94, '$12.0B', ARRAY['insurance', 'AI', 'claims', 'automation'], true),
('Pet Insurance Comparison Platform', 'Consumer', 'AI-matched pet insurance quotes with vet network and claims tracking', '$5k–$30k MRR', '100k+/mo', 'Rising', 73, 50, 84, '$2.5B', ARRAY['insurance', 'pets', 'comparison', 'fintech'], false),

-- ── CLIMATE TECH ────────────────────────────────────────
('Carbon Footprint Tracker for SMBs', 'B2B SaaS', 'Calculates and tracks emissions across scope 1, 2, 3 with offset marketplace', '$8k–$50k MRR', '10k+/mo', 'Explosive', 82, 40, 91, '$6.0B', ARRAY['climate', 'carbon', 'ESG', 'SMB'], true),
('Renewable Energy Procurement Platform', 'B2B SaaS', 'Helps businesses source and purchase renewable energy certificates at scale', '$15k–$90k MRR', '2k+/mo', 'Rising', 78, 35, 90, '$9.0B', ARRAY['climate', 'energy', 'procurement', 'B2B'], true),
('EV Fleet Management SaaS', 'B2B SaaS', 'Route optimization, charge scheduling, and telematics for EV fleets', '$10k–$65k MRR', '5k+/mo', 'Explosive', 84, 38, 92, '$7.5B', ARRAY['climate', 'EV', 'fleet', 'telematics'], true),
('Sustainable Packaging Sourcing Tool', 'B2B SaaS', 'Matches e-commerce brands with vetted eco-packaging suppliers', '$4k–$22k MRR', '15k+/mo', 'Rising', 70, 44, 83, '$2.8B', ARRAY['climate', 'packaging', 'sustainable', 'ecommerce'], false),

-- ── SECURITY ────────────────────────────────────────────
('AI Phishing Simulation Platform', 'B2B SaaS', 'Realistic phishing simulations with auto-training for employees who fail', '$8k–$50k MRR', '5k+/mo', 'Rising', 76, 46, 87, '$3.5B', ARRAY['security', 'phishing', 'training', 'B2B'], true),
('Secrets Management for DevOps', 'B2B SaaS', 'Centralized secret rotation and audit logging for engineering teams', '$7k–$42k MRR', '15k+/mo', 'Rising', 74, 44, 86, '$2.5B', ARRAY['security', 'secrets', 'devops', 'developer'], true),
('AI Vulnerability Scanner', 'AI', 'Continuously scans codebases for CVEs and misconfigurations', '$10k–$65k MRR', '8k+/mo', 'Rising', 78, 42, 89, '$4.5B', ARRAY['security', 'AI', 'vulnerability', 'scanner'], true),
('Zero-Trust Access Management', 'B2B SaaS', 'Identity-based access policies for remote teams and contractors', '$10k–$65k MRR', '5k+/mo', 'Rising', 76, 44, 88, '$5.0B', ARRAY['security', 'zero-trust', 'access', 'IAM'], true),

-- ── ADDITIONAL AI ────────────────────────────────────────
('AI Customer Segmentation Tool', 'AI', 'Automatically clusters customers by behavior and LTV for targeting', '$8k–$48k MRR', '20k+/mo', 'Rising', 76, 46, 87, '$2.8B', ARRAY['AI', 'segmentation', 'marketing', 'analytics'], true),
('AI Fraud Detection for Marketplaces', 'AI', 'Real-time transaction scoring and account fraud prevention', '$15k–$100k MRR', '5k+/mo', 'Explosive', 87, 38, 93, '$8.0B', ARRAY['AI', 'fraud', 'marketplace', 'fintech'], true),
('Conversational AI for E-commerce', 'AI', 'Shopping assistant chatbot that upsells, answers questions, and reduces returns', '$8k–$50k MRR', '15k+/mo', 'Rising', 76, 50, 86, '$4.2B', ARRAY['AI', 'ecommerce', 'chatbot', 'shopping'], false),
('AI Menu Optimization for Restaurants', 'AI', 'Analyzes sales data to recommend menu changes that increase profitability', '$5k–$28k MRR', '8k+/mo', 'Rising', 72, 42, 85, '$1.5B', ARRAY['AI', 'restaurant', 'menu', 'analytics'], true),
('AI Forecast for Retail Demand', 'AI', 'ML-powered demand forecasting with seasonality and promo lift modeling', '$10k–$65k MRR', '5k+/mo', 'Rising', 78, 44, 88, '$4.0B', ARRAY['AI', 'retail', 'forecasting', 'ML'], true),
('AI Personal Shopping Assistant', 'AI', 'Natural language product search and styling for fashion e-commerce', '$5k–$30k MRR', '300k+/mo', 'Rising', 73, 55, 83, '$3.5B', ARRAY['AI', 'shopping', 'fashion', 'consumer'], false),
('AI-Powered CRM for Startups', 'AI', 'Self-updating CRM that enriches contacts and logs activities automatically', '$7k–$42k MRR', '25k+/mo', 'Explosive', 83, 48, 90, '$5.0B', ARRAY['AI', 'CRM', 'sales', 'startup'], true),
('AI Chatbot for Real Estate Agents', 'AI', 'Qualifies leads, schedules showings, and answers property questions 24/7', '$5k–$30k MRR', '20k+/mo', 'Rising', 74, 46, 85, '$2.2B', ARRAY['AI', 'real-estate', 'chatbot', 'lead-gen'], false),
('AI Financial Report Writer', 'AI', 'Turns spreadsheet data into narrative financial reports with insights', '$8k–$50k MRR', '10k+/mo', 'Rising', 76, 42, 88, '$2.5B', ARRAY['AI', 'finance', 'reporting', 'analytics'], true),
('AI Translation API for SaaS', 'AI', 'Context-aware translation with glossary management for SaaS localization', '$6k–$38k MRR', '30k+/mo', 'Rising', 72, 48, 85, '$2.0B', ARRAY['AI', 'translation', 'localization', 'API'], false);
