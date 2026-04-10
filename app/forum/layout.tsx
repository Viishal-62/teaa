import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Forum — Suggest & Vote on Features",
  description:
    "Help shape the future of Teaa. Submit feature requests, upvote ideas from the community, and track what's shipping next on the Teaa roadmap.",
  keywords: [
    "teaa feature requests",
    "teaa community forum",
    "teaa roadmap",
    "suggest features teaa",
    "teaa feedback",
    "teaa improvements",
    "vote on features",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/forum",
  },
  openGraph: {
    title: "Community Forum — Suggest & Vote on Features",
    description:
      "Help shape the future of Teaa. Submit feature requests, upvote ideas, and track what's shipping next.",
    url: "https://www.teaadrop.xyz/forum",
    type: "website",
  },
};

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
