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
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");

    // Build mailto link and open it
    const mailtoSubject = encodeURIComponent(
      subject || "Contact from Teaa Website",
    );
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
    );
    window.open(
      `mailto:wishalgautam2@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`,
      "_self",
    );

    setTimeout(() => {
      setFormState("sent");
      setTimeout(() => {
        setFormState("idle");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }, 3000);
    }, 500);
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

        {/* Email Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-10 p-6 rounded-2xl border border-black/5 bg-white/60 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
              <Mail size={20} className="text-black/50" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-1">
                Email us directly
              </p>
              <a
                href="mailto:wishalgautam2@gmail.com"
                className="text-lg font-bold text-black hover:text-accent transition-colors serif"
              >
                wishalgautam2@gmail.com
              </a>
            </div>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-12"
        >
          <h2 className="text-[11px] font-bold text-black uppercase tracking-wide mb-6">
            Or send us a message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Submit */}
            <AnimatePresence mode="wait">
              {formState === "sent" ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-sm font-medium"
                >
                  <CheckCircle size={16} />
                  Your email client should have opened! We&apos;ll get back to
                  you soon.
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  disabled={formState === "sending"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/85 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  {formState === "sending" ? "Opening..." : "Send Message"}
                </motion.button>
              )}
            </AnimatePresence>
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
                className="group p-4 rounded-xl border border-black/5 bg-white/40 hover:bg-white/80 hover:border-black/10 transition-all"
              >
                <link.icon
                  size={18}
                  className="text-black/30 group-hover:text-black/60 transition-colors mb-2"
                />
                <p className="text-sm font-semibold text-black/70 group-hover:text-black transition-colors">
                  {link.title}
                </p>
                <p className="text-[11px] text-black/40 mt-0.5">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="mt-12 text-[11px] text-black/30 text-center serif">
          We take every message seriously — especially content reports and
          safety concerns.
        </p>
      </div>
    </div>
  );
}
