import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { KraitinLogo } from '@/components/ui/KraitinLogo';
import PageMeta from '@/components/common/PageMeta';
import { BLOG_POSTS, BLOG_CATEGORIES } from '@/data/blogPosts';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Ideation:   'text-[#C5FF00]/70 bg-[#C5FF00]/[0.07] border-[#C5FF00]/15',
  Validation: 'text-emerald-400/70 bg-emerald-400/[0.07] border-emerald-400/15',
  Strategy:   'text-sky-400/70 bg-sky-400/[0.07] border-sky-400/15',
  Building:   'text-violet-400/70 bg-violet-400/[0.07] border-violet-400/15',
  Launch:     'text-orange-400/70 bg-orange-400/[0.07] border-orange-400/15',
  Tools:      'text-rose-400/70 bg-rose-400/[0.07] border-rose-400/15',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogIndexPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-[#080a0e] text-white">
      <PageMeta
        title="Blog & Resources — Startup Tips for Founders | Kraitin"
        description="Practical guides for startup founders — how to find startup ideas, validate demand, analyze competitors, plan MVPs, and launch products. Updated regularly by the Kraitin team."
        ogTitle="Kraitin Blog — Startup Guides & Resources for Founders"
        ogDescription="Practical, no-fluff guides for founders: idea discovery, validation, competitor analysis, MVP planning, and launch strategy."
        ogUrl="https://kraitin.com/blog"
      />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 border-b border-white/[0.06] bg-[#080a0e]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}><KraitinLogo size="sm" /></button>
          <span className="text-white/20 text-sm">/</span>
          <span className="text-sm text-white/50 font-medium">Blog</span>
        </div>
        <button
          onClick={() => navigate('/login?tab=register')}
          className="h-8 px-4 rounded-full bg-[#C5FF00] text-black text-xs font-bold hover:bg-[#C5FF00]/90 transition-all"
        >
          Try Kraitin Free
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-16">

        {/* ── Hero ── */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-[#C5FF00]/60" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Resources</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white text-balance mb-3">
            Startup Guides & Resources
          </h1>
          <p className="text-sm text-white/40 max-w-lg text-pretty leading-relaxed">
            Practical, no-fluff guides for founders at every stage — from finding your first idea to getting your first 1,000 users.
          </p>
        </div>

        {/* ── Category filter ── */}
        <div className="flex flex-wrap gap-2 mb-12">
          {BLOG_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'h-7 px-3.5 rounded-full border text-[11px] font-semibold transition-all',
                activeCategory === cat
                  ? 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]'
                  : 'border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Featured post ── */}
        {featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="group block mb-12 p-6 md:p-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-[#C5FF00]/20 hover:bg-white/[0.03] transition-all"
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', CATEGORY_COLORS[featured.category] ?? 'text-white/40 bg-white/[0.05] border-white/10')}>
                {featured.category}
              </span>
              <span className="text-[10px] text-white/25 uppercase tracking-widest">Featured</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white text-balance mb-3 group-hover:text-[#C5FF00]/90 transition-colors">
              {featured.title}
            </h2>
            <p className="text-sm text-white/40 leading-relaxed text-pretty mb-6 max-w-2xl">
              {featured.description}
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/25">{formatDate(featured.publishDate)}</span>
                <span className="flex items-center gap-1 text-xs text-white/25">
                  <Clock className="w-3 h-3" />{featured.readTime} min read
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#C5FF00]/60 group-hover:text-[#C5FF00] transition-colors">
                Read article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        )}

        {/* ── Article grid ── */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rest.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col p-5 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all h-full"
              >
                <div className="mb-3">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', CATEGORY_COLORS[post.category] ?? 'text-white/40 bg-white/[0.05] border-white/10')}>
                    {post.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white/80 text-balance mb-2 group-hover:text-white transition-colors flex-1">
                  {post.title}
                </h3>
                <p className="text-xs text-white/30 leading-relaxed text-pretty mb-4 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/20">{formatDate(post.publishDate)}</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/20">
                      <Clock className="w-2.5 h-2.5" />{post.readTime} min
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-[#C5FF00]/60 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/25 text-sm">No articles in this category yet.</p>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="mt-20 pt-12 border-t border-white/[0.05] text-center">
          <p className="text-xs text-white/25 mb-2">Ready to put this into practice?</p>
          <p className="text-base font-bold text-white/70 mb-6 text-balance">
            Kraitin automates everything you just read about — research, validation, competitor analysis, and launch strategy.
          </p>
          <button
            onClick={() => navigate('/login?tab=register')}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#C5FF00] text-black text-sm font-bold hover:bg-[#C5FF00]/90 transition-all"
          >
            Start free — no credit card <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 py-8 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-[11px]">© 2026 Kraitin · Built by Israel Thompson, age 18.</p>
          <div className="flex items-center gap-4">
            {[{ label: 'Home', to: '/' }, { label: 'Docs', to: '/docs' }, { label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }].map(l => (
              <Link key={l.to} to={l.to} className="text-[11px] text-white/20 hover:text-white/50 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
