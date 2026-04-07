import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Disclaimer | Teaa",
  description: "Crucial disclaimers and safety notices for Teaa users.",
};

export default function DisclaimerPage() {
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
            Disclaimer & Safety Notice
          </h1>
          <p className="text-sm text-black/50 font-medium">
            Please read this before proceeding on the platform.
          </p>
        </header>

        <div className="space-y-10 text-sm leading-relaxed serif prose prose-p:text-black/70 prose-headings:text-black/90 max-w-none">
          <section className="bg-red-50 border border-red-100 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-red-900 sans-serif tracking-wide uppercase text-[11px] mb-3">
              1. Not Professional Support
            </h2>
            <p className="text-red-900/80">
              Teaa is an entertainment and venting platform. It is <strong>NOT</strong> a substitute 
              for professional mental health advice, therapy, or emergency services. If you are 
              experiencing a crisis, feeling overwhelmed, or considering self-harm, please close 
              this site and contact your local emergency services or mental health hotlines immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              2. The Reality of "Absolute Anonymity"
            </h2>
            <p>
              While we intentionally design our application to obscure identities by omitting 
              user accounts and relying strictly on randomized local storage tokens, no system 
              on the open internet provides absolute, mathematically perfect anonymity against 
              determined state-level adversaries or court-ordered subpoenas. We will comply 
              with lawful requests, but we intentionally collect as little data as technically 
              possible to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              3. User-Generated Content
            </h2>
            <p>
              Everything you read on Teaa is user-generated. We do not verify the authenticity, 
              accuracy, or truthfulness of any confession, gossip, or secret posted to the platform. 
              Information encountered should be treated as fiction or entertainment. The views expressed 
              by users do not represent the views or opinions of Teaa's developers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black sans-serif tracking-wide uppercase text-[11px] mb-3">
              4. Zero-Tolerance Policy
            </h2>
            <p>
              Despite the freedom of anonymity, we implement strict automated AI-moderation barriers. 
              Any attempts to use our platform to coordinate illegal acts, engage in targeted severe bullying, 
              or exploit minors will result in immediate content destruction and potential IP/device bans 
              at the edge-network level.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
