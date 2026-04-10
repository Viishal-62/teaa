import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confess Anonymously — Drop Your Secret Now",
  description:
    "Write or record your confession anonymously. Choose a mood, set it to self-destruct, and let it out — no signup, no trace. Text or voice confessions with AI moderation.",
  keywords: [
    "confess anonymously",
    "anonymous confession form",
    "drop a confession",
    "write secret anonymously",
    "anonymous vent online",
    "post confession free",
    "send anonymous confession",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/confess",
  },
  openGraph: {
    title: "Confess Anonymously — Drop Your Secret Now",
    description:
      "Write or record your confession anonymously. Choose a mood, set it to self-destruct, and let it out — no signup, no trace.",
    url: "https://www.teaadrop.xyz/confess",
    type: "website",
  },
};

export default function ConfessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
