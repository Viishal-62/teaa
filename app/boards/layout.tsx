import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse All Boards — Find Your Confession Community",
  description:
    "Explore all public confession boards on Teaa. Find communities for colleges, friend groups, workplaces, fandoms and more. Join a board or create your own.",
  keywords: [
    "confession boards list",
    "anonymous community boards",
    "public confession pages",
    "college confession board",
    "teaa boards directory",
    "anonymous group boards",
    "find confession page",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/boards",
  },
  openGraph: {
    title: "Browse All Boards — Find Your Confession Community",
    description:
      "Explore all public confession boards on Teaa. Find communities for colleges, friend groups, workplaces & more.",
    url: "https://www.teaadrop.xyz/boards",
    type: "website",
  },
};

export default function BoardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
