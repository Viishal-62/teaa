"use client";

import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Search, X } from "lucide-react";

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
}

// Using Tenor's free API (no key required for basic search via their v1 public endpoint)
const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Google's public Tenor API key

export default function GifPicker({ onGifSelect }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ url: string; preview: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<{ url: string; preview: string }[]>(
    [],
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load trending on open
  useEffect(() => {
    if (isOpen && trending.length === 0) {
      fetchTrending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=12&media_filter=tinygif,gif`,
      );
      const data = await res.json();
      const gifs =
        data.results?.map((r: any) => ({
          url: r.media_formats.gif.url,
          preview: r.media_formats.tinygif.url,
        })) ?? [];
      setTrending(gifs);
    } catch (e) {
      console.error("Tenor trending failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(q)}&limit=12&media_filter=tinygif,gif`,
      );
      const data = await res.json();
      const gifs =
        data.results?.map((r: any) => ({
          url: r.media_formats.gif.url,
          preview: r.media_formats.tinygif.url,
        })) ?? [];
      setResults(gifs);
    } catch (e) {
      console.error("Tenor search failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchGifs(val), 400);
  };

  const displayGifs = query.trim() ? results : trending;

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-black/[0.02] border border-black/5 hover:bg-black/[0.05] transition-all text-black/30 hover:text-black flex items-center justify-center"
        title="Add GIF"
      >
        <ImageIcon size={18} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-[9999] w-72 bg-white border border-black/8 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-fade-in">
          {/* Search bar */}
          <div className="p-3 border-b border-black/5">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] border border-black/5 rounded-lg">
              <Search size={14} className="text-black/20" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search GIFs..."
                className="flex-1 bg-transparent outline-none text-xs text-black placeholder:text-black/20"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                >
                  <X size={12} className="text-black/20" />
                </button>
              )}
            </div>
          </div>

          {/* Results grid */}
          <div className="p-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
              </div>
            ) : displayGifs.length === 0 ? (
              <p className="text-center text-[10px] text-black/20 py-6 font-medium">
                {query ? "No GIFs found" : "Loading..."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {displayGifs.map((gif, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onGifSelect(gif.url);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="rounded-lg overflow-hidden hover:ring-2 hover:ring-accent transition-all aspect-square"
                  >
                    <img
                      src={gif.preview}
                      alt="GIF"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tenor attribution */}
          <div className="px-3 py-2 border-t border-black/5 text-center">
            <span className="text-[8px] text-black/15 font-bold uppercase tracking-wider">
              Powered by Tenor
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
