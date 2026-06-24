import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { KraitinLogo } from '@/components/ui/KraitinLogo';
import { BLOG_POSTS, getPostBySlug, getRelatedPosts, type BlockType } from '@/data/blogPosts';
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

/* ── Content block renderer ────────────────────────────────────── */
function Block({ block }: { block: BlockType }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="text-xl font-bold text-white mt-12 mb-4 text-balance">{block.text}</h2>;
    case 'h3':
      return <h3 className="text-base font-bold text-white/85 mt-8 mb-3 text-balance">{block.text}</h3>;
    case 'p':
      return <p className="text-sm text-white/55 leading-[1.85] text-pretty">{block.text}</p>;
    case 'ul':
      return (
        <ul className="space-y-2 my-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-white/50 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/40 shrink-0 mt-2" />
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="space-y-2.5 my-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-white/50 leading-relaxed">
              <span className="text-[11px] font-bold text-[#C5FF00]/50 shrink-0 w-5 pt-0.5 tabular-nums">{i + 1}.</span>
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ol>
      );
    case 'quote':
      return (
        <blockquote className="my-6 pl-5 border-l-2 border-[#C5FF00]/30">
          <p className="text-sm text-white/50 italic leading-relaxed text-pretty">"{block.text}"</p>
          {block.attribution && (
            <p className="text-xs text-white/25 mt-2 not-italic">— {block.attribution}</p>
          )}
        </blockquote>
      );
    case 'callout':
      return (
        <div className="my-6 p-5 rounded-xl bg-[#C5FF00]/[0.05] border border-[#C5FF00]/15">
          {block.label && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5FF00]/60 mb-2">{block.label}</p>
          )}
          <p className="text-sm text-white/60 leading-relaxed text-pretty">{block.text}</p>
        </div>
      );
    default:
      return null;
  }
}

/* ── Related article card ──────────────────────────────────────── */
function RelatedCard({ post }: { post: (typeof BLOG_POSTS)[0] }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col p-4 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
    >
      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border self-start mb-3', CATEGORY_COLORS[post.category] ?? 'text-white/40 bg-white/[0.05] border-white/10')}>
        {post.category}
      </span>
      <h4 className="text-xs font-bold text-white/70 text-balance mb-2 group-hover:text-white transition-colors flex-1">{post.title}</h4>
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-white/20">
        <Clock className="w-2.5 h-2.5" />{post.readTime} min
      </div>
    </Link>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = getPostBySlug(slug ?? '');
  const related = getRelatedPosts(slug ?? '', 3);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center gap-4 text-white/40">
        <BookOpen className="w-10 h-10" />
        <p className="text-sm">Article not found.</p>
        <Link to="/blog" className="text-xs text-[#C5FF00]/60 hover:text-[#C5FF00] transition-colors">← Back to Blog</Link>
      </div>
    );
  }

  const canonicalUrl = `https://kraitin.com/blog/${post.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    author: { '@type': 'Organization', name: 'Kraitin', url: 'https://kraitin.com' },
    publisher: {
      '@type': 'Organization',
      name: 'Kraitin',
      logo: { '@type': 'ImageObject', url: 'https://kraitin.com/favicon.png' },
    },
    url: canonicalUrl,
    image: 'https://kraitin.com/og-image.png',
    keywords: post.tags.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };

  return (
    <div className="min-h-screen bg-[#080a0e] text-white">
      <Helmet>
        <title>{post.title} | Kraitin Blog</title>
        <meta name="description" content={post.description} />
        <meta name="keywords" content={post.tags.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://kraitin.com/og-image.png" />
        <meta property="article:published_time" content={post.publishDate} />
        <meta property="article:author" content="Kraitin" />
        <meta property="article:tag" content={post.tags.join(', ')} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content="https://kraitin.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Helmet>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 border-b border-white/[0.06] bg-[#080a0e]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')}><KraitinLogo size="sm" /></button>
          <span className="text-white/20 text-sm shrink-0">/</span>
          <Link to="/blog" className="text-sm text-white/40 hover:text-white/70 transition-colors shrink-0">Blog</Link>
          <span className="text-white/15 text-sm shrink-0">/</span>
          <span className="text-sm text-white/50 truncate">{post.title}</span>
        </div>
        <button
          onClick={() => navigate('/login?tab=register')}
          className="shrink-0 h-8 px-4 rounded-full bg-[#C5FF00] text-black text-xs font-bold hover:bg-[#C5FF00]/90 transition-all ml-4"
        >
          Try Kraitin Free
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-14">

        {/* ── Back ── */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> All articles
        </Link>

        {/* ── Article header ── */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', CATEGORY_COLORS[post.category] ?? 'text-white/40 bg-white/[0.05] border-white/10')}>
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/25">
              <Clock className="w-3 h-3" />{post.readTime} min read
            </span>
            <span className="text-xs text-white/20">{formatDate(post.publishDate)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white text-balance leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-sm text-white/40 leading-relaxed text-pretty max-w-2xl">
            {post.description}
          </p>
        </header>

        {/* ── Article body ── */}
        <article className="space-y-5">
          {post.content.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </article>

        {/* ── Tags ── */}
        <div className="flex flex-wrap gap-2 mt-14 pt-8 border-t border-white/[0.05]">
          {post.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.07] text-white/25">
              {tag}
            </span>
          ))}
        </div>

        {/* ── In-article CTA ── */}
        <div className="mt-12 p-6 md:p-8 rounded-2xl border border-[#C5FF00]/15 bg-[#C5FF00]/[0.04]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5FF00]/50 mb-2">Apply what you just learned</p>
          <p className="text-base font-bold text-white/80 text-balance mb-4">
            Kraitin automates everything in this guide — research, validation, competitor analysis, MVP planning, and launch strategy.
          </p>
          <button
            onClick={() => navigate('/login?tab=register')}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#C5FF00] text-black text-sm font-bold hover:bg-[#C5FF00]/90 transition-all"
          >
            Start free — no credit card <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <section className="mt-16">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/20 mb-5">Related articles</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {related.map(p => <RelatedCard key={p.slug} post={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 py-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-[11px]">© 2026 Kraitin · Built by Israel Thompson, age 18.</p>
          <div className="flex items-center gap-4">
            {[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: 'Docs', to: '/docs' }, { label: 'Privacy', to: '/privacy' }].map(l => (
              <Link key={l.to} to={l.to} className="text-[11px] text-white/20 hover:text-white/50 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
