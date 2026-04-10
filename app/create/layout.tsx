import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Confession Board — Free Anonymous Board Setup",
  description:
    "Create your own anonymous confession board in seconds. Pick a theme, customize reactions, set moderation rules, and share the link — no signup required. Perfect for colleges, friend groups & workplaces.",
  keywords: [
    "create confession board",
    "anonymous board maker",
    "confession page setup",
    "NGL alternative create board",
    "custom confession board",
    "free confession board",
    "anonymous board generator",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/create",
  },
  openGraph: {
    title: "Create Confession Board — Free Anonymous Board Setup",
    description:
      "Create your own anonymous confession board in seconds. Pick a theme, customize reactions & share the link — no signup required.",
    url: "https://www.teaadrop.xyz/create",
    type: "website",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
