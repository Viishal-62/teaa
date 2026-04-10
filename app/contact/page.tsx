"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Shield,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loadedAt, setLoadedAt] = useState<number>(0);

  useEffect(() => {
    setLoadedAt(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          _honeypot: honeypot,
          _loadedAt: loadedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setFormState("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      
      // Reset back to idle after 5 seconds automatically
      setTimeout(() => {
        setFormState("idle");
      }, 5000);
    } catch (error: any) {
      setFormState("error");
      setErrorMessage(error.message || "An unexpected error occurred.");
    }
  };

  const quickLinks = [
    {
      icon: Shield,
      title: "Privacy Policy",
      description: "How we handle your data & anonymity",
      href: "/privacy",
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Suggest features & vote on ideas",
      href: "/forum",
    },
    {
      icon: Clock,
      title: "Terms of Service",
      description: "Usage rules & content guidelines",
      href: "/terms",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black/80 px-6 py-12 page-enter">
      <div className="max-w-3xl mx-auto py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black/40 hover:text-black font-semibold uppercase tracking-wider text-[10px] mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-black serif tracking-tight text-black mb-4">
            Contact Us
          </h1>
          <p className="text-sm text-black/50 font-medium leading-relaxed max-w-lg">
            Got a question, found a bug, or want to report something? We&apos;d
            love to hear from you. We typically respond within 24–48 hours.
          </p>
        </header>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-12 bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-black/5"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
              <Mail size={18} className="text-black/50" />
            </div>
            <h2 className="text-lg font-bold text-black serif">
              Get in Touch
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field - hidden from users but visible to bots */}
            <div aria-hidden="true" className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 overflow-hidden">
              <input
                type="text"
                name="_honeypot"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Name & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-2"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous is fine too"
                  className="w-full px-4 py-3 rounded-xl border border-black/8 bg-white/80 text-sm text-black/80 placeholder:text-black/20 focus:outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-2"
                >
                  Your Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="so we can reply"
                  className="w-full px-4 py-3 rounded-xl border border-black/8 bg-white/80 text-sm text-black/80 placeholder:text-black/20 focus:outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="contact-subject"
                className="block text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-2"
              >
                Subject
              </label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/8 bg-white/80 text-sm text-black/80 focus:outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a topic...</option>
                <option value="Bug Report">🐛 Bug Report</option>
                <option value="Feature Request">💡 Feature Request</option>
                <option value="Content Report">🚩 Report Content</option>
                <option value="Data Request">🔒 Data / Privacy Request</option>
                <option value="Partnership">🤝 Partnership / Business</option>
                <option value="General">💬 General Question</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="contact-message"
                className="block text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-2"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="w-full px-4 py-3 rounded-xl border border-black/8 bg-white/80 text-sm text-black/80 placeholder:text-black/20 focus:outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all resize-none"
              />
            </div>

            {/* Submit & Status */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                {formState === "sent" ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm font-medium"
                  >
                    <CheckCircle size={18} className="shrink-0" />
                    <span>Message sent successfully! We&apos;ll get back to you soon.</span>
                  </motion.div>
                ) : formState === "error" ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm font-medium">
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormState("idle")}
                      className="self-start text-[11px] uppercase tracking-widest font-bold text-black/40 hover:text-black transition-colors"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="submit"
                    type="submit"
                    disabled={formState === "sending"}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/85 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                    {formState === "sending" ? "Sending..." : "Send Message"}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h2 className="text-[11px] font-bold text-black uppercase tracking-wide mb-5">
            Helpful Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-5 rounded-xl border border-black/5 bg-white/40 hover:bg-white/80 hover:border-black/10 transition-all flex flex-col items-start"
              >
                <div className="mb-3 p-2 rounded-lg bg-black/5 group-hover:bg-black/10 transition-colors">
                  <link.icon
                    size={18}
                    className="text-black/60 group-hover:text-black transition-colors"
                  />
                </div>
                <p className="text-sm font-semibold text-black/80 group-hover:text-black transition-colors">
                  {link.title}
                </p>
                <p className="text-[11px] text-black/40 mt-1 leading-relaxed">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="mt-12 text-[11px] text-black/30 text-center serif max-w-sm mx-auto">
          We take every message seriously — especially content reports and
          safety concerns. Your trust means everything.
        </p>
      </div>
    </div>
  );
}
