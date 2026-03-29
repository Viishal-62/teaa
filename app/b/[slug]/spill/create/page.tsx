"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { THEMES, type ThemeKey } from "@/convex/helpers";
import { PenTool, ChevronLeft, Image as ImageIcon, Plus, Sparkles, BookOpen } from "lucide-react";

export default function CreateSpillStudio() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const board = useQuery(api.boards.getBySlug, { slug });
  
  const createSpill = useMutation(api.spills.create);
  const addChapter = useMutation(api.chapters.add);
  const updateCoverImage = useMutation(api.spills.updateCoverImage);

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<ThemeKey>(THEMES[0].key);
  const [emoji, setEmoji] = useState("📖");
  const [chapters, setChapters] = useState([{ title: "", text: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [remainingGenerations, setRemainingGenerations] = useState(10);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Emojis for cover
  const EMOJI_OPTIONS = ["📖", "🤫", "🔥", "💔", "🥀", "👀", "🔪", "🍷"];

  const handleAddChapter = () => {
    setChapters([...chapters, { title: "", text: "" }]);
  };

  const publishSpill = async () => {
    if (!board || !title.trim() || isSubmitting) return;
    
    // Validate chapters
    if (chapters.some(c => !c.text.trim())) {
      alert("Please make sure all chapters have content.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the Spill book
      const res = await createSpill({
        boardId: board._id,
        title: title.trim(),
        coverTheme: theme,
        coverEmoji: emoji,
      });

      // If AI cover was generated, update the DB record immediately (requires backend patch)
      if (aiImageUrl) {
        await updateCoverImage({ 
          spillId: res.spillId, 
          imageUrl: aiImageUrl 
        });
      }

      // 2. Insert all chapters sequentially
      for (let i = 0; i < chapters.length; i++) {
        await addChapter({
          spillId: res.spillId,
          chapterNumber: i + 1,
          title: chapters[i].title,
          text: chapters[i].text,
        });
      }

      // 3. Redirect to board feed
      router.push(`/b/${slug}`);
      
    } catch (e) {
      console.error(e);
      alert("Failed to publish spill. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (board === undefined) return <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center animate-pulse" />;

  const selectedTheme = THEMES.find((t) => t.key === theme) || THEMES[0];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black font-sans pb-32">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 h-16 bg-[#faf8f5]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-50 border-b border-black/5">
        <Link href={`/b/${slug}`} className="flex items-center gap-2 text-black/40 hover:text-black transition-colors px-2 py-2 -ml-2 rounded-xl">
          <ChevronLeft size={20} />
          <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
          The Writer's Studio
        </span>
        <button
          onClick={publishSpill}
          disabled={isSubmitting || !title || chapters.some(c => !c.text.trim())}
          className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-black/80"
        >
          {isSubmitting ? "Publishing..." : "Publish Spill"}
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 space-y-16">
        
        {/* Cover Designer */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
              <BookOpen size={14} className="text-black/60" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Design The Cover</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Preview Book */}
            <div 
              className="w-full max-w-[240px] mx-auto aspect-[3/4] rounded-r-2xl rounded-l-md shadow-2xl relative overflow-hidden flex flex-col justify-between p-8 text-center border-l-[8px] border-black/20 transition-all duration-500"
              style={{ background: aiImageUrl ? `url(${aiImageUrl}) center/cover` : selectedTheme.bg }}
            >
              {!aiImageUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
              
              <div className={`absolute inset-0 flex flex-col items-center justify-between p-8 backdrop-blur-[2px] ${aiImageUrl ? 'bg-black/30' : ''}`}>
                <div className="relative z-10 flex flex-col items-center gap-2 mt-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80" style={{ color: aiImageUrl ? "#fff" : selectedTheme.accent }}>Deep Spill</span>
                  <div className="w-8 h-px bg-current opacity-30" style={{ color: aiImageUrl ? "#fff" : selectedTheme.accent }} />
                </div>

                <div className="relative z-10 space-y-4">
                  {!aiImageUrl && <span className="text-3xl drop-shadow-sm">{emoji}</span>}
                  <h3 className="text-2xl font-black serif leading-[1.1] tracking-tight text-white mb-8" style={{ color: aiImageUrl ? "#fff" : selectedTheme.text }}>
                    {title || "Untitled Spill"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                  Book Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Freshman Year Disaster"
                  className="w-full text-base font-semibold bg-transparent border-b-2 border-black/10 px-2 py-3 outline-none focus:border-black transition-all placeholder:text-black/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                  Vibe & Colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.key}
                      style={{ background: t.bg }}
                      onClick={() => setTheme(t.key)}
                      className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shadow-inner relative overflow-hidden ${
                        theme === t.key ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-105 opacity-80 object-cover border border-white/10"
                      }`}
                    >
                      <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                 <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                  Cover Icon
                </label>
                 <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                        emoji === e ? "bg-black text-white scale-110 shadow-lg" : "bg-black/5 hover:bg-black/10"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Generative Cover Block */}
              <div className="mt-8 pt-6 border-t border-black/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-500" />
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/60">
                      OpenRouter AI Cover
                    </label>
                  </div>
                  <span className="text-[9px] font-bold bg-black/5 px-2 py-1 rounded text-black/40">
                    {remainingGenerations} left
                  </span>
                </div>
                
                <button
                  type="button"
                  disabled={isGeneratingCover || remainingGenerations <= 0 || !title.trim()}
                  onClick={async () => {
                    if (remainingGenerations <= 0) return;
                    setIsGeneratingCover(true);
                    try {
                      // Call OpenRouter API route here
                      const res = await fetch("/api/generate-cover", {
                        method: "POST",
                        body: JSON.stringify({ prompt: title })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setAiImageUrl(data.imageUrl);
                        setRemainingGenerations(r => r - 1);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsGeneratingCover(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all font-bold text-[11px] uppercase tracking-widest disabled:opacity-40 disabled:hover:bg-purple-50"
                >
                  {isGeneratingCover ? "Generating..." : "Generate Custom Art"}
                </button>
                <p className="text-[9px] text-black/30 text-center mt-3 leading-relaxed">
                  Requires OpenRouter API key configured in backend. Art is generated automatically from your book title.
                </p>
              </div>
              
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="space-y-8 pt-8 border-t border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
              <PenTool size={14} className="text-black/60" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Write Chapters</h2>
          </div>

          <div className="space-y-12">
            {chapters.map((chapter, idx) => (
              <div key={idx} className="relative bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                  Chapter {idx + 1}
                </div>
                
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => {
                    const newChapters = [...chapters];
                    newChapters[idx].title = e.target.value;
                    setChapters(newChapters);
                  }}
                  placeholder="Optional Chapter Title (e.g. The Setup)"
                  className="w-full text-lg font-serif font-bold mt-2 bg-transparent border-none outline-none placeholder:text-black/20"
                />
                
                <textarea
                  value={chapter.text}
                  onChange={(e) => {
                    const newChapters = [...chapters];
                    newChapters[idx].text = e.target.value;
                    setChapters(newChapters);
                  }}
                  placeholder="Start writing the deep tea here..."
                  className="w-full h-48 mt-4 resize-none bg-transparent border-none outline-none leading-relaxed text-black/80 placeholder:text-black/20 text-md focus:ring-0"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleAddChapter}
            className="w-full py-6 border-2 border-dashed border-black/10 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-black/40 hover:text-black hover:bg-black/[0.02] hover:border-black/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Next Chapter
          </button>
        </section>
      </main>
    </div>
  );
}
