import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import NotificationCenter from "./components/NotificationCenter";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.teaadrop.xyz"),
  title: {
    default: "Teaa 🫣 — Anonymous Confessions & Secret Boards",
    template: "%s | Teaa",
  },
  description:
    "The ultimate platform for anonymous confessions. Spill your secrets, create personal confession boards, drop voice notes, and share links. No sign-up, 100% anonymous.",
  keywords: [
    "anonymous confessions",
    "secret board",
    "confession link",
    "spill the tea",
    "anonymous messaging",
    "send anonymous message",
    "confession page",
    "voice confessions",
  ],
  authors: [{ name: "Teaa" }],
  creator: "Teaa",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.teaadrop.xyz",
    siteName: "Teaa 🫣",
    title: "Teaa 🫣 — Anonymous Confessions",
    description:
      "Create a confession board, share the link, and let people confess anonymously. No sign-up. No trace. Just truth.",
    images: [
      {
        url: "/og-image.jpeg", // Add a nice image at public/og-image.jpg for social sharing preview!
        width: 1200,
        height: 630,
        alt: "Teaa - Anonymous Confessions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Teaa 🫣 — Anonymous Confessions",
    description:
      "Create a confession board, share the link, and let people confess anonymously. No sign-up. No trace. Just truth.",
    images: ["/og-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "_YZz0qb_Q4IQGtaAKdMnF-HT16Lfz_oxSJx7YWMuDnM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Teaa 🫣",
    url: "https://www.teaadrop.xyz",
    description:
      "The ultimate platform for anonymous confessions. Spill your secrets, create personal confession boards.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.teaadrop.xyz/explore?category={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>
          {children}
          <NotificationCenter />
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
