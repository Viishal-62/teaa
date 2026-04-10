import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Teaa — Features, Privacy & How It Works",
  description:
    "Discover how Teaa works — the most feature-rich anonymous confession platform. Voice confessions, doodles, secret admirers, AI moderation, disappearing messages & more. No signup required.",
  keywords: [
    "about teaa",
    "anonymous platform features",
    "how teaa works",
    "confession app features",
    "teaa privacy",
    "anonymous app review",
    "teaa confession platform",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/about",
  },
  openGraph: {
    title: "About Teaa — Features, Privacy & How It Works",
    description:
      "Discover how Teaa works — voice confessions, doodles, secret admirers, AI moderation & more. No signup required.",
    url: "https://www.teaadrop.xyz/about",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
