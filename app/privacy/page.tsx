import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Teaa",
  description: "How we handle your data and anonymity on Teaa.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-black/80 px-6 py-12 page-enter">
      <div className="max-w-3xl mx-auto py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black/40 hover:text-black font-semibold uppercase tracking-wider text-[10px] mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        <header className="mb-12">
          <h1 className="text-3xl font-black serif tracking-tight text-black mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-black/50 font-medium">
            Last Updated: April 2026
          </p>
        </header>

        <div className="space-y-10 text-sm leading-relaxed serif prose prose-p:text-black/70 prose-headings:text-black/90 max-w-none">
          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              1. Anonymity First
            </h2>
            <p>
              Teaa is built on the foundation of anonymity. We do not require you
              to create an account, provide an email address, or link traditional
              social profiles to read or post confessions. Your raw truth remains yours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              2. Data We Collect
            </h2>
            <p>
              To keep the platform safe, prevent spam, and enable features like user-specific
              reactions without accounts, we collect minimal non-personally identifiable
              information:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Local Storage Tokens:</strong> We generate and store a randomized `visitorId` in your browser to prevent rate-limit abuse and allow you to track your own active reactions.</li>
              <li><strong>Creator Tokens:</strong> If you create a board, a secret token is saved to your local device so you can administer it later.</li>
              <li><strong>Usage Data:</strong> Basic analytics such as IP addresses (processed temporarily for rate limiting/DDoS protection) and general browser fingerprints.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              3. How We Use the Data
            </h2>
            <p>
              We use your device tokens strictly for operational purposes: enforcing rate limits,
              delivering AI moderation blocks, tracking view counts, and ensuring the technical
              stability of the platform. We do not sell your data or browsing habits to third-party
              advertising agencies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              4. Data Retention & "Disappearing Tea"
            </h2>
            <p>
              You have the option to set custom expiration timers (e.g., auto-delete after 24 hours 
              or 25 views). Once a confession expires, it is permanently purged from our database 
              and cannot be recovered. Long-term posts remain indefinitely unless flagged by our 
              moderation AI, reported by the community, or deleted by a board creator.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              5. Voice and Image Uploads
            </h2>
            <p>
              Any voice recordings or doodles you choose to share are securely hosted on 
              our media delivery networks. Do not include identifying personal images or 
              vocal metadata if you intend to stay strictly anonymous.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
