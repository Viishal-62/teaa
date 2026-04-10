import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { Calendar, MoveLeft, ArrowUpRight } from "lucide-react";
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

// Custom components to override default MDX styling
// Custom components to override default MDX styling
const components = {
  h1: (props: any) => <h1 className="text-4xl font-extrabold mt-12 mb-4 serif" {...props} />,
  h2: (props: any) => <h2 className="text-2xl md:text-3xl font-black mt-12 mb-6 tracking-tight text-black border-none" {...props} />,
  h3: (props: any) => <h3 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-black/90" {...props} />,
  p: (props: any) => <p className="text-base md:text-lg leading-[1.8] mb-6 text-black/70 font-medium" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside mb-6 space-y-3 text-black/70 font-medium" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-6 space-y-3 text-black/70 font-medium" {...props} />,
  li: (props: any) => <li className="pl-2" {...props} />,
  a: (props: any) => <a className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-500 font-bold hover:opacity-80 transition-opacity underline decoration-rose-500/30 underline-offset-4" {...props} />,
  strong: (props: any) => <strong className="font-bold text-black" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-black/10 pl-6 italic text-black/50 my-8 py-2 font-serif text-lg md:text-xl" {...props} />,
  table: (props: any) => (
    <div className="overflow-x-auto my-8 border border-black/5 rounded-xl bg-white/30 p-2">
      <table className="w-full text-left text-sm whitespace-nowrap" {...props} />
    </div>
  ),
  th: (props: any) => <th className="p-4 font-black uppercase tracking-wider text-[10px] text-black/50 border-b border-black/5" {...props} />,
  td: (props: any) => <td className="p-4 text-black/70 font-medium border-b border-black/5 last:border-none" {...props} />
};

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

  // Define Table of Contents directly from parsed file
  const toc = post.toc;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black/80 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 flex flex-col md:flex-row gap-12">
        {/* Main Content wrapped in a Premium Card */}
        <div className="md:w-[70%] max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-black/40 hover:text-black font-semibold uppercase tracking-wider text-[10px] mb-8 transition-colors"
          >
            <MoveLeft size={14} /> Back to Blog
          </Link>
          
          <article className="p-8 md:p-12 rounded-[2rem] bg-white/60 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-black serif tracking-tight text-black mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-black/40">
                <span className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-lg text-black/60">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="bg-black/5 px-3 py-1.5 rounded-lg text-black/60">
                  TeaaDrop Team
                </span>
              </div>
            </div>

            <div className="prose prose-lg max-w-none prose-img:rounded-3xl prose-img:shadow-[0_8px_30px_rgb(0,0,0,0.08)] prose-img:border prose-img:border-black/5">
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
          </article>
        </div>

        {/* Sidebar (Table of Contents) in matching Card */}
        <aside className="md:w-[30%] hidden md:block">
          <div className="sticky top-24 p-8 bg-white/60 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] backdrop-blur-md">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-black/40">
              <ArrowUpRight className="w-4 h-4" />
              On this page
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              {toc.length > 0 ? (
                toc.map((item: any, index: number) => (
                  <li 
                    key={index} 
                    style={{ marginLeft: `${Math.max(0, (item.level - 2) * 12)}px` }}
                  >
                    <a 
                      href={`#${item.id}`} 
                      className="text-black/50 hover:text-black transition-colors block leading-tight"
                    >
                      {item.text}
                    </a>
                  </li>
                ))
              ) : (
                 <li className="text-[10px] uppercase font-bold text-black/20">No headings</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
