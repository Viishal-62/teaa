import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Anonymous Confessions — Browse the Global Feed",
  description:
    "Browse thousands of anonymous confessions from people worldwide. Filter by mood, city, or profession. Read real untold stories — all completely anonymous. Updated in real-time.",
  keywords: [
    "anonymous confessions feed",
    "browse confessions",
    "read anonymous stories",
    "confession explore page",
    "anonymous mood feed",
    "real confessions online",
    "anonymous stories to read",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/explore",
  },
  openGraph: {
    title: "Explore Anonymous Confessions — Browse the Global Feed",
    description:
      "Browse thousands of anonymous confessions. Filter by mood, city, or profession. All completely anonymous.",
    url: "https://www.teaadrop.xyz/explore",
    type: "website",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
