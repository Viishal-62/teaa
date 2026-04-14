import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import NotificationCenter from "./components/NotificationCenter";
import { Analytics } from "@vercel/analytics/next";
import BottomNav from "./components/BottomNav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.teaadrop.xyz"),
  title: {
    default: "Teaa 🫣 — Anonymous Confessions & Secret Boards",
    template: "%s | Teaa",
  },
  description:
    "The best NGL alternative for anonymous confessions. Create confession boards, send anonymous messages, drop voice notes, share links & doodle anonymously. No sign-up, no trace — 100% anonymous. Better than NGL, Sarahah & LMK.",
  keywords: [
    "anonymous confessions",
    "NGL alternative",
    "confession board",
    "anonymous messaging app",
    "secret admirer app",
    "spill the tea",
    "anonymous voice confession",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz",
  },
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
        url: "/og-image.jpeg",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Teaa" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>
          {children}
          <NotificationCenter />
          <BottomNav />
        </ConvexClientProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#111111",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              padding: "14px 20px",
            },
          }}
          offset={80}
        />
        <Analytics />
      </body>
    </html>
  );
}
