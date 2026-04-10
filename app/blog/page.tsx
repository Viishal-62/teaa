import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { MoveRight, Calendar, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Teaaa 🫖",
  description: "Read the latest news, updates, and community stories on the Teaadrop blog.",
  alternates: {
    canonical: "https://www.teaadrop.xyz/blog",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen bg-[#faf8f5] text-black/80 px-4 sm:px-6 py-12 page-enter overflow-hidden">

      <div className="relative z-10 max-w-2xl mx-auto py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black/40 hover:text-black font-semibold uppercase tracking-wider text-[10px] mb-12 transition-colors bg-white/40 px-5 py-2.5 rounded-full border border-black/5 backdrop-blur-md shadow-sm"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        <header className="mb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-black/5 text-[9px] font-bold uppercase tracking-[0.2em] mb-6 text-black/40 shadow-sm">
            <span className="text-sm leading-none">🫖</span> Updates & News
          </div>
          <h1 className="text-5xl md:text-7xl font-black serif tracking-tight text-black mb-6 drop-shadow-sm">
            The Teaaa Blog
          </h1>
          <p className="text-base md:text-xl text-black/50 font-medium max-w-2xl mx-auto leading-relaxed">
            Thoughts, feature deep-dives, and community stories. Everything happening behind the scenes.
          </p>
        </header>

        <div className="space-y-8">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group relative"
            >
              {/* Clean Flat Solid White Card */}
              <article
                className="group relative z-10 p-8 md:p-10 rounded-[2rem] bg-white border border-black/10 hover:border-black/20 transition-all duration-500 ease-out transform hover:-translate-y-1 overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  opacity: 0,
                }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6 bg-white border border-black/5 shadow-sm inline-flex px-4 py-2 rounded-xl group-hover:border-black/10 transition-colors">
                    <Calendar className="w-3.5 h-3.5 text-black/30 group-hover:text-black/50 transition-colors" />
                    <time>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </time>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black serif tracking-tight text-black mb-5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-indigo-500 transition-all duration-500">
                    {post.title}
                  </h2>

                  <p className="text-base md:text-lg text-black/50 font-medium leading-[1.8] mb-10 max-w-2xl group-hover:text-black/70 transition-colors duration-500">
                    {post.description}
                  </p>

                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full group-hover:bg-black group-hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                    <span>Read Article</span>
                    <MoveRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all duration-300" />
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-20 bg-white/50 rounded-[2.5rem] border border-black/5 backdrop-blur-md shadow-sm">
              <span className="text-5xl mb-6 block opacity-40">📝</span>
              <p className="text-sm text-black/40 font-bold uppercase tracking-widest">
                No posts published yet
              </p>
            </div>
          )}
        </div>

        {posts.length > 0 && (
          <footer className="mt-24 pt-12 border-t border-black/5 flex flex-col items-center">
            <span className="text-4xl opacity-[0.15] mb-4 block">🫖</span>
            <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.25em] text-center">
              More stories brewing soon
            </p>
          </footer>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .serif { font-family: Georgia, 'Times New Roman', serif; }
        `
      }} />
    </div>
  );
}
