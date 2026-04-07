import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Teaa",
  description: "Terms and conditions for using the Teaa anonymous platform.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-black/50 font-medium">
            Last Updated: April 2026
          </p>
        </header>

        <div className="space-y-10 text-sm leading-relaxed serif prose prose-p:text-black/70 prose-headings:text-black/90 max-w-none">
          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Teaa ("the Platform"), you accept and agree
              to be bound by the terms and provisions of this agreement. If you do
              not agree to abide by these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              2. Nature of the Service
            </h2>
            <p>
              Teaa is an anonymous platform designed for dropping confessions,
              secrets, and gossip. We provide the infrastructure for users to express
              themselves anonymously. While we implement AI moderation, we are not
              the publishers of user-generated content and do not actively endorse or verify
              the accuracy of any submissions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              3. User Conduct and Content Rules
            </h2>
            <p>You are solely responsible for the content you submit. You agree NOT to post:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-red-900/60 font-medium">
              <li>Hate speech, severe bullying, or targeted harassment.</li>
              <li>Illegal content, explicit non-consensual imagery, or threats of violence.</li>
              <li>Doxxing or highly sensitive personal identifiable information (PII) of others.</li>
            </ul>
            <p className="mt-3">
              Teaa utilizes AI moderation filters and creator-enforced banned word lists.
              We reserve the right to remove any content at our sole discretion, without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              4. Creator Responsibilities
            </h2>
            <p>
              Users who create private or public "Boards" on Teaa are granted administrative
              controls (such as deleting posts or viewing inboxes). Creators are expected to
              manage their boards responsibly and respect the anonymity built into the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              5. Limitation of Liability
            </h2>
            <p>
              Teaa and its operators shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use of the
              service or any user-generated content hosted on our boards. Use the platform
              at your own risk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
