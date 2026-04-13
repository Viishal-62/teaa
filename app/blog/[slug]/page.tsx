import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { Calendar, MoveLeft, ArrowUpRight, Clock, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    if (!post) {
      return { title: "Not Found — Teaaa 🫖" };
    }
    
    return {
      title: `${post.title} — Teaaa Blog`,
      description: post.description,
      alternates: {
        canonical: `https://www.teaadrop.xyz/blog/${post.slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.description,
        url: `https://www.teaadrop.xyz/blog/${post.slug}`,
        type: "article",
        publishedTime: post.date,
        authors: ["Teaadrop Team"],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
      },
    };
  } catch (error) {
    return { title: "Blog — Teaaa 🫖" };
  }
}

/* ── MDX Components ── */
const components = {
  h1: (props: any) => <h1 className="text-3xl md:text-4xl font-black mt-14 mb-5 serif tracking-tight text-black" {...props} />,
  h2: (props: any) => (
    <h2 className="blog-h2 text-[1.4rem] md:text-[1.65rem] font-black mt-14 mb-5 tracking-tight text-black relative pl-5" {...props} />
  ),
  h3: (props: any) => <h3 className="text-lg md:text-xl font-bold mt-10 mb-4 text-black/85 tracking-tight" {...props} />,
  p: (props: any) => <p className="text-[15px] md:text-[16px] leading-[1.85] mb-6 text-black/60 font-[450]" {...props} />,
  ul: (props: any) => <ul className="blog-ul list-none mb-6 space-y-2.5 text-black/60 font-[450]" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-6 space-y-2.5 text-black/60 font-[450] pl-1 text-[15px] md:text-[16px] leading-[1.8]" {...props} />,
  li: (props: any) => (
    <li className="blog-li pl-5 relative text-[15px] md:text-[16px] leading-[1.8]" {...props} />
  ),
  a: (props: any) => (
    <a
      className="font-semibold text-rose-500 hover:text-rose-600 transition-colors underline decoration-rose-200 underline-offset-[3px] decoration-[1.5px] hover:decoration-rose-400"
      {...props}
    />
  ),
  strong: (props: any) => <strong className="font-bold text-black/80" {...props} />,
  em: (props: any) => <em className="italic text-black/50 not-italic-reset" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="blog-blockquote relative my-8 py-5 px-6 bg-gradient-to-r from-stone-50 to-orange-50/30 rounded-2xl border border-black/[0.04]" {...props} />
  ),
  /* ─── TABLE — fully reworked for mobile ─── */
  table: (props: any) => (
    <div className="blog-table-wrap my-8 -mx-2 sm:mx-0">
      {/* Scroll hint on mobile */}
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-2 pl-2 flex items-center gap-1.5 md:hidden">
        <span>←</span> Scroll to see more <span>→</span>
      </p>
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <table className="w-full text-left" style={{ minWidth: '600px' }} {...props} />
      </div>
    </div>
  ),
  thead: (props: any) => <thead className="blog-thead" {...props} />,
  tbody: (props: any) => <tbody className="blog-tbody" {...props} />,
  tr: (props: any) => <tr className="blog-tr" {...props} />,
  th: (props: any) => (
    <th className="px-4 py-3 font-black uppercase tracking-wider text-[9px] text-black/50 border-b-2 border-black/[0.06] bg-stone-50 whitespace-nowrap" {...props} />
  ),
  td: (props: any) => (
    <td className="px-4 py-3 text-black/60 font-medium text-[12.5px] border-b border-black/[0.04] whitespace-nowrap" {...props} />
  ),
  hr: () => (
    <div className="my-12 flex items-center justify-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-black/[0.06]" />
      <span className="text-lg opacity-20">🫖</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-black/[0.06]" />
    </div>
  ),
  code: (props: any) => {
    const isBlock = typeof props.children === 'string' && props.children.includes('\n');
    if (isBlock || props.className) {
      return (
        <code className="block bg-[#1a1a2e] text-stone-300 rounded-xl p-5 my-6 text-sm leading-relaxed overflow-x-auto font-mono" {...props} />
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[0.85em] font-semibold border border-rose-100" {...props} />
    );
  },
  pre: (props: any) => (
    <pre className="bg-[#1a1a2e] rounded-2xl p-0 my-8 overflow-hidden border border-white/[0.05] shadow-lg" {...props} />
  ),
};

/* ── Reusable CTA Block ── */
function CtaCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-6 md:p-7 bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl md:rounded-[1.75rem] text-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] ${className}`}>
      <div className="flex items-start gap-4">
        <span className="text-2xl md:text-3xl shrink-0">🫖</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-black tracking-tight mb-1.5">
            Ready to spill?
          </h4>
          <p className="text-[12px] md:text-[13px] text-white/45 font-medium leading-relaxed mb-4">
            Create your anonymous board and start receiving confessions in seconds.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.15em] rounded-full hover:scale-[1.03] active:scale-95 transition-transform shadow-sm"
          >
            Create Board
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Share Buttons ── */
function ShareButtons({ title, slug, className = "" }: { title: string; slug: string; className?: string }) {
  const url = `https://www.teaadrop.xyz/blog/${slug}`;
  return (
    <div className={`p-5 md:p-6 bg-white/70 backdrop-blur-sm border border-black/[0.05] rounded-2xl md:rounded-[1.75rem] ${className}`}>
      <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 mb-3">
        Share this article
      </h4>
      <div className="flex gap-2">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] transition-colors text-center text-[10px] font-bold uppercase tracking-wider text-black/40 hover:text-black/60"
        >
          Twitter / X
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' — ' + url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] transition-colors text-center text-[10px] font-bold uppercase tracking-wider text-black/40 hover:text-black/60"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch (error) {
    notFound();
  }

  const toc = post.toc;
  const allPosts = getAllPosts();
  const related = allPosts.filter(p => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black/80 pb-24">

      {/* ── Ambient blurs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-200/20 to-orange-200/15 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-200/15 to-indigo-200/10 blur-[100px]" />
      </div>

      {/* ── Hero header ── */}
      <header className="relative z-10 border-b border-black/[0.04]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-10 md:pt-12 md:pb-14">

          {/* Back + breadcrumb */}
          <div className="flex items-center gap-2 mb-8 md:mb-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-black/35 hover:text-black/70 font-semibold uppercase tracking-wider text-[10px] transition-colors bg-white/60 px-4 py-2 rounded-full border border-black/5 backdrop-blur-md shadow-sm hover:shadow-md hover:border-black/10"
            >
              <MoveLeft size={13} /> Blog
            </Link>
            <ChevronRight size={12} className="text-black/15 hidden sm:block" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-black/25 truncate max-w-[200px] hidden sm:block">
              {post.title}
            </span>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-black/[0.06] text-[10px] font-bold uppercase tracking-widest text-black/45 shadow-sm">
              <Calendar className="w-3 h-3" />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-black/[0.06] text-[10px] font-bold uppercase tracking-widest text-black/45 shadow-sm">
              <Clock className="w-3 h-3" />
              {post.readingTime} min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[1.65rem] sm:text-3xl md:text-[2.6rem] font-black serif tracking-tight text-black leading-[1.12] mb-5">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-[14px] md:text-base text-black/40 font-medium leading-relaxed max-w-2xl">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-black/[0.06] text-[9px] font-bold uppercase tracking-wider text-black/35 shadow-sm"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gradient accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />
      </header>

      {/* ── Content Area ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-14 flex flex-col md:flex-row gap-8 md:gap-10">

        {/* ── Main article ── */}
        <article className="md:w-[68%] max-w-3xl min-w-0">
          <div className="bg-white/70 backdrop-blur-sm border border-black/[0.05] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 md:p-10 lg:p-12">

            {/* Progress line */}
            <div className="w-12 h-[3px] rounded-full bg-gradient-to-r from-rose-400 to-orange-300 mb-8 md:mb-10" />

            <div className="prose prose-lg max-w-none blog-content">
              <MDXRemote 
                source={post.content} 
                components={components}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypeSlug],
                  }
                }}
              />
            </div>

            {/* End mark */}
            <div className="mt-12 pt-8 border-t border-black/[0.05] flex flex-col items-center gap-2">
              <span className="text-2xl opacity-15">🫖</span>
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-black/15">
                End of article
              </p>
            </div>
          </div>

          {/* ── Mobile-only: CTA + Share ── */}
          <div className="mt-6 space-y-4 md:hidden">
            <CtaCard />
            <ShareButtons title={post.title} slug={post.slug} />
          </div>

          {/* ── Related Posts ── */}
          {related.length > 0 && (
            <div className="mt-8 md:mt-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 mb-4 pl-1">
                Continue Reading
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((relPost) => (
                  <Link
                    key={relPost.slug}
                    href={`/blog/${relPost.slug}`}
                    className="group block"
                  >
                    <div className="p-5 rounded-xl md:rounded-2xl bg-white/70 backdrop-blur-sm border border-black/[0.05] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-black/10">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-black/30 mb-2.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(relPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span className="mx-0.5">·</span>
                        {relPost.readingTime} min
                      </span>
                      <h4 className="text-[13px] font-bold text-black/75 leading-snug mb-1.5 group-hover:text-rose-500 transition-colors blog-line-clamp-2">
                        {relPost.title}
                      </h4>
                      <p className="text-[11px] text-black/35 font-medium leading-relaxed blog-line-clamp-2">
                        {relPost.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── Desktop Sidebar ── */}
        <aside className="md:w-[32%] hidden md:block">
          <div className="sticky top-8 space-y-5">

            {/* Table of Contents */}
            <div className="p-6 bg-white/70 backdrop-blur-sm border border-black/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem]">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-black/35">
                <ArrowUpRight className="w-3.5 h-3.5" />
                On this page
              </h4>

              <div className="w-full h-px bg-gradient-to-r from-black/[0.06] to-transparent mb-4" />

              <nav>
                <ul className="space-y-0.5">
                  {toc.length > 0 ? (
                    toc.map((item: any, index: number) => (
                      <li 
                        key={index} 
                        style={{ paddingLeft: `${Math.max(0, (item.level - 2) * 12)}px` }}
                      >
                        <a 
                          href={`#${item.id}`} 
                          className="block py-1.5 text-[12.5px] font-medium text-black/35 hover:text-black/75 transition-colors leading-snug hover:pl-1 duration-200"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="text-[10px] uppercase font-bold text-black/15">No headings</li>
                  )}
                </ul>
              </nav>
            </div>

            {/* CTA Card */}
            <CtaCard />

            {/* Share */}
            <ShareButtons title={post.title} slug={post.slug} />
          </div>
        </aside>
      </div>

      {/* ── Styles ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .serif { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }

          .blog-line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Smooth scroll */
          html { scroll-behavior: smooth; }
          [id] { scroll-margin-top: 2rem; }

          /* H2 left accent bar */
          .blog-h2::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0.15em;
            bottom: 0.15em;
            width: 3px;
            border-radius: 3px;
            background: linear-gradient(to bottom, #f43f5e, #f97316);
          }

          /* UL bullet styling */
          .blog-li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0.7em;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f43f5e, #f97316);
            opacity: 0.5;
          }

          /* Blockquote children */
          .blog-blockquote::before {
            content: '"';
            position: absolute;
            top: 8px;
            left: 16px;
            font-size: 3rem;
            font-family: 'Playfair Display', Georgia, serif;
            color: rgba(244,63,94,0.12);
            line-height: 1;
          }
          .blog-blockquote p {
            font-family: 'Playfair Display', Georgia, serif !important;
            font-size: 0.95rem !important;
            font-style: italic !important;
            color: rgba(0,0,0,0.50) !important;
            line-height: 1.7 !important;
            margin: 0 !important;
            padding-left: 1rem;
          }

          /* ─── TABLE STYLES ─── */
          /* First column sticky on scroll */
          .blog-table-wrap table th:first-child,
          .blog-table-wrap table td:first-child {
            position: sticky;
            left: 0;
            z-index: 2;
            background: inherit;
            font-weight: 700;
            color: rgba(0,0,0,0.7);
          }
          .blog-table-wrap table th:first-child {
            background: #f9f7f4;
          }
          .blog-table-wrap table td:first-child {
            background: #fff;
            border-right: 2px solid rgba(0,0,0,0.04);
          }

          /* Alternating rows */
          .blog-tbody .blog-tr:nth-child(even) {
            background: rgba(0,0,0,0.012);
          }
          .blog-tbody .blog-tr:nth-child(even) td:first-child {
            background: #faf9f6;
          }

          /* Row hover */
          .blog-tbody .blog-tr:hover {
            background: rgba(244,63,94,0.03);
          }
          .blog-tbody .blog-tr:hover td:first-child {
            background: rgba(244,63,94,0.04);
          }

          /* Yes/No cell coloring */
          .blog-tbody td {
            text-align: center;
          }
          .blog-tbody td:first-child {
            text-align: left;
          }

          /* Table header row */
          .blog-thead th {
            text-align: center;
          }
          .blog-thead th:first-child {
            text-align: left;
          }

          /* Scrollbar for table */
          .blog-table-wrap > div {
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.1) transparent;
          }
          .blog-table-wrap > div::-webkit-scrollbar {
            height: 6px;
          }
          .blog-table-wrap > div::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.08);
            border-radius: 3px;
          }

          /* Code blocks */
          pre code {
            background: transparent !important;
            border: none !important;
            padding: 1.25rem !important;
            display: block;
            font-size: 13px !important;
            line-height: 1.7 !important;
            color: #cbd5e1 !important;
          }

          /* Mobile article padding adjustments */
          @media (max-width: 640px) {
            .blog-content p,
            .blog-content li {
              font-size: 14.5px !important;
            }
            .blog-table-wrap {
              margin-left: -0.75rem;
              margin-right: -0.75rem;
            }
          }
        `
      }} />
    </div>
  );
}
