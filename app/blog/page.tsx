import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { MoveRight, Calendar, ArrowLeft, Clock, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Teaaa 🫖",
  description: "Read the latest news, updates, and community stories on the Teaadrop blog.",
  alternates: {
    canonical: "https://www.teaadrop.xyz/blog",
  },
};

/* ── Accent color per post index ── */
const ACCENTS = [
  { gradient: "from-rose-500 to-orange-400", glow: "rgba(244,63,94,0.08)", tag: "bg-rose-50 text-rose-600 border-rose-100" },
  { gradient: "from-violet-500 to-indigo-400", glow: "rgba(139,92,246,0.08)", tag: "bg-violet-50 text-violet-600 border-violet-100" },
  { gradient: "from-emerald-500 to-teal-400", glow: "rgba(16,185,129,0.08)", tag: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { gradient: "from-amber-500 to-orange-400", glow: "rgba(245,158,11,0.08)", tag: "bg-amber-50 text-amber-600 border-amber-100" },
  { gradient: "from-sky-500 to-cyan-400", glow: "rgba(14,165,233,0.08)", tag: "bg-sky-50 text-sky-600 border-sky-100" },
];

export default function BlogIndex() {
  const posts = getAllPosts();
  const featured = posts[0]; // Latest post is featured
  const rest = posts.slice(1);

  return (
    <div className="relative min-h-screen bg-[#faf8f5] text-black/80 overflow-hidden">

      {/* ── Ambient decorations ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-rose-200/30 to-orange-200/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-200/20 to-indigo-200/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 page-enter">

        {/* ── Back ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black/40 hover:text-black/70 font-semibold uppercase tracking-wider text-[10px] mb-12 transition-colors bg-white/60 px-5 py-2.5 rounded-full border border-black/5 backdrop-blur-md shadow-sm hover:shadow-md hover:border-black/10"
        >
          <ArrowLeft size={13} /> Back to home
        </Link>

        {/* ── Header ── */}
        <header className="mb-16 md:mb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 border border-black/5 text-[9px] font-black uppercase tracking-[0.25em] mb-7 text-black/40 shadow-sm backdrop-blur-md">
            <span className="text-base leading-none">🫖</span>
            <span>Blog</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black serif tracking-tight text-black mb-5">
            Stories & Updates
          </h1>
          <p className="text-base md:text-lg text-black/45 font-medium max-w-lg mx-auto leading-relaxed">
            Deep dives, product updates, and the culture of anonymous sharing.
          </p>
        </header>

        {/* ── Featured Post (Hero Card) ── */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="block group mb-14"
          >
            <article
              className="relative overflow-hidden rounded-[2rem] bg-white border border-black/[0.06] shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)] hover:border-black/10 hover:-translate-y-1"
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${ACCENTS[0].gradient}`} />

              <div className="p-8 md:p-12">

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/40">
                    <Calendar className="w-3 h-3" />
                    <time>
                      {new Date(featured.date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </time>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-black/15" />
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/40">
                    <Clock className="w-3 h-3" />
                    {featured.readingTime} min read
                  </span>
                  <span className="ml-auto px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 text-white text-[9px] font-black uppercase tracking-widest">
                    Latest
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-[2.75rem] font-black serif tracking-tight text-black mb-5 leading-[1.15] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-orange-400 transition-all duration-500">
                  {featured.title}
                </h2>

                {/* Description */}
                <p className="text-base md:text-lg text-black/50 font-medium leading-[1.8] mb-8 max-w-3xl">
                  {featured.description}
                </p>

                {/* Tags */}
                {featured.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {featured.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ACCENTS[0].tag}`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Read CTA */}
                <div className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#0A0A0A] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full group-hover:scale-[1.03] active:scale-95 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  <span>Read Article</span>
                  <MoveRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1.5 transition-all duration-300" />
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* ── Grid of remaining posts ── */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((post, index) => {
              const accent = ACCENTS[(index + 1) % ACCENTS.length];
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article
                    className="relative h-full overflow-hidden rounded-[1.75rem] bg-white border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-black/10 hover:-translate-y-1 flex flex-col"
                    style={{
                      animationDelay: `${index * 80}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    {/* Accent bar */}
                    <div className={`h-1 w-full bg-gradient-to-r ${accent.gradient}`} />

                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent.glow}, transparent 70%)` }}
                    />

                    <div className="relative z-10 p-7 md:p-8 flex flex-col flex-1">

                      {/* Meta */}
                      <div className="flex items-center gap-2.5 mb-5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/35">
                          <Calendar className="w-3 h-3" />
                          <time>
                            {new Date(post.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric'
                            })}
                          </time>
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-black/15" />
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/35">
                          <Clock className="w-3 h-3" />
                          {post.readingTime} min
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-black serif tracking-tight text-black mb-3 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-indigo-500 transition-all duration-500">
                        {post.title}
                      </h2>

                      {/* Description */}
                      <p className="text-sm text-black/45 font-medium leading-[1.7] mb-5 flex-1 line-clamp-3">
                        {post.description}
                      </p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${accent.tag}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/40 group-hover:text-black/70 transition-colors mt-auto pt-4 border-t border-black/[0.04]">
                        <span>Read more</span>
                        <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-24 bg-white/60 rounded-[2.5rem] border border-black/5 backdrop-blur-md shadow-sm">
            <span className="text-5xl mb-6 block opacity-30">📝</span>
            <p className="text-sm text-black/40 font-bold uppercase tracking-widest">
              No posts published yet
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        {posts.length > 0 && (
          <footer className="mt-20 pt-10 border-t border-black/5 flex flex-col items-center gap-3">
            <span className="text-3xl opacity-[0.12]">🫖</span>
            <p className="text-[10px] text-black/25 font-bold uppercase tracking-[0.3em]">
              More stories brewing soon
            </p>
          </footer>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .serif { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
}
