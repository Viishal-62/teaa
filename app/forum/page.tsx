"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getVisitorId, timeAgo } from "@/app/lib/utils";
import Link from "next/link";
import { ArrowLeft, Home, MessageSquare, ChevronUp, Check, Clock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForumPage() {
  const [visitorId, setVisitorId] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  const featureRequests = useQuery(api.forum.listFeatureRequests, filter === "all" ? {} : { status: filter });
  const userUpvotes = useQuery(api.forum.getUserUpvotes, visitorId ? { visitorId } : "skip");
  const upvotedSet = new Set(userUpvotes || []);

  const toggleUpvote = useMutation(api.forum.toggleUpvote);
  const submitFeatureRequest = useMutation(api.forum.submitFeatureRequest);

  const handleToggleUpvote = async (requestId: any) => {
    if (!visitorId) return;
    try {
      await toggleUpvote({ requestId, visitorId });
    } catch (error) {
      console.error("Failed to toggle upvote", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !visitorId) return;

    setIsSubmitting(true);
    try {
      await submitFeatureRequest({
        title: title.trim(),
        description: description.trim(),
        visitorId,
      });
      setTitle("");
      setDescription("");
      setShowSubmitModal(false);
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">
            <Clock size={10} /> Planned
          </span>
        );
      case "shipped":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-500/20">
            <Check size={10} /> Shipped
          </span>
        );
      case "under-review":
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-black/5 text-black/50 rounded-full text-[9px] font-bold uppercase tracking-widest border border-black/5">
            <Zap size={10} /> Under Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black page-enter">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-black/30 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 text-black/40 hover:text-black hover:bg-black/10 transition-colors"
          >
            <Home size={14} />
          </Link>
        </div>
        <h1 className="text-[10px] font-black uppercase tracking-[0.25em] text-black/25">
          Community
        </h1>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-black text-white rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-black/10"
        >
          New Idea
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-200/50">
            <MessageSquare size={28} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-black serif tracking-tight mb-3">
            What should we build next?
          </h2>
          <p className="text-[12px] text-black/40 max-w-md mx-auto leading-relaxed font-medium">
            Vote on upcoming features or suggest your own ideas. We actively review the top requested features to decide our roadmap.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "All Ideas" },
            { id: "under-review", label: "Under Review" },
            { id: "planned", label: "Planned" },
            { id: "shipped", label: "Shipped" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                filter === f.id
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "bg-white text-black/40 border border-black/5 hover:border-black/15 hover:text-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List of Requests */}
        {featureRequests === undefined ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
          </div>
        ) : featureRequests.length === 0 ? (
          <div className="text-center py-16 bg-white border border-black/5 rounded-2xl">
            <span className="text-4xl block mb-4">🌱</span>
            <p className="text-lg font-bold serif mb-1">No ideas found</p>
            <p className="text-xs text-black/35 mb-6">
              Be the first to suggest something for this category.
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
            >
              Suggest Feature
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {featureRequests.map((req) => {
              const hasUpvoted = upvotedSet.has(req._id);
              return (
                <motion.div
                  key={req._id}
                  layout
                  className="bg-white border border-black/5 rounded-[1.5rem] p-5 flex gap-4 sm:gap-6 hover:shadow-lg hover:shadow-black/[0.02] transition-shadow"
                >
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleToggleUpvote(req._id)}
                    className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl border flex-shrink-0 transition-all active:scale-95 ${
                      hasUpvoted
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-[#faf8f5] border-black/5 text-black/30 hover:border-black/15 hover:text-black"
                    }`}
                  >
                    <ChevronUp size={24} className={hasUpvoted ? "translate-y-0.5" : ""} />
                    <span className="text-[11px] font-black">{req.upvotes}</span>
                  </button>

                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="text-lg font-black serif text-black leading-tight">
                        {req.title}
                      </h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-[12px] text-black/60 leading-relaxed font-medium mb-3">
                      {req.description}
                    </p>
                    <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-black/25">
                      <span>{timeAgo(req.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-[100px] pointer-events-none" />
              
              <h2 className="text-2xl font-black serif mb-2 relative z-10">Suggest a Feature</h2>
              <p className="text-[11px] text-black/40 font-medium mb-6 relative z-10">
                What's missing? Keep it concise and specific so others can understand and vote for it.
              </p>

              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-1.5 block">
                    Feature Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Add Dark Mode"
                    maxLength={100}
                    className="w-full text-sm bg-[#faf8f5] border border-black/5 focus:border-black/15 outline-none rounded-xl px-4 py-3 font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-1.5 block">
                    Description (How it works & Why)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what it does and why it would make Teaaa better..."
                    maxLength={1000}
                    rows={4}
                    className="w-full text-sm bg-[#faf8f5] border border-black/5 focus:border-black/15 outline-none rounded-xl px-4 py-3 font-medium transition-colors resize-none leading-relaxed"
                  />
                  <div className="text-right mt-1">
                    <span className="text-[10px] text-black/25 font-mono">
                      {description.length}/1000
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-3.5 rounded-xl border border-black/5 text-black/40 text-[10px] font-bold uppercase tracking-widest hover:bg-[#faf8f5] hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim() || !description.trim() || isSubmitting}
                    className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:scale-100"
                  >
                    {isSubmitting && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    Submit Idea
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
