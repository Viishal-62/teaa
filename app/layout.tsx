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
    "NGL link alternative",
    "best NGL alternative",
    "apps like NGL",
    "NGL alternative for Instagram",
    "anonymous confession app",
    "anonymous confession website",
    "confession app",
    "confession website",
    "confession link",
    "confession page",
    "confession page for Instagram",
    "create confession page",
    "anonymous message link",
    "send anonymous message",
    "anonymous messaging",
    "anonymous messaging app",
    "anonymous message for Instagram",
    "secret message link",
    "secret board",
    "anonymous board",
    "college confession page",
    "school confession page",
    "anonymous gossip",
    "gossip app",
    "anonymous voice message",
    "voice confession",
    "voice confessions app",
    "secret admirer message",
    "secret admirer app",
    "anonymous love letter",
    "anonymous feedback",
    "anonymous Q&A",
    "ask me anything anonymous",
    "spill the tea",
    "anonymous social media",
    "Sarahah alternative",
    "LMK alternative",
    "Yolo alternative",
    "anonymous app like NGL",
    "free anonymous messaging",
    "anonymous message website",
    "send secret message online",
    "anonymous doodle",
    "anonymous stories",
    "deep confessions",
    "online confession box",
    "confession box for college",
    "anonymous truth",
    "unfiltered confessions",

    "anonymous messages",
    "anonymous confession",
    "confession website",
    "anonymous chat",
    "gossip app",
    "anonymous posting",
    "secret sharing app",
    "anonymous social app",
    "vent anonymously",
    "anonymous feedback",


    "anonymous confession website for students",
    "post secrets anonymously online",
    "where can I confess anonymously",
    "anonymous confession app without login",
    "write secret message anonymously",
    "share secrets anonymously free",
    "best anonymous confession platform",
    "online confession board anonymous",
    "submit confession anonymously website",


    "confess crush anonymously online",
    "send anonymous message to someone",
    "how to tell someone anonymously you like them",
    "anonymous love confession website",
    "secret admirer message anonymous",
    "send crush message anonymously free",
    "anonymous flirting app",
    "anonymous dating confession platform",

    "complain about boss anonymously online",
    "anonymous workplace feedback tool free",
    "office gossip anonymous platform",
    "expose company anonymously website",
    "anonymous employee feedback app",
    "share workplace issues anonymously",
    "report toxic workplace anonymously",


    "vent anonymously online free",
    "where to share feelings anonymously",
    "anonymous rant website",
    "talk without revealing identity online",
    "mental health anonymous sharing app",
    "anonymous support community",
    "safe place to vent anonymously",


    "is there a site to post anonymously",
    "how to send anonymous messages online",
    "best anonymous confession websites",
    "apps like NGL anonymous",
    "how to confess without revealing identity",
    "can I message someone anonymously",
    "how to post secrets online anonymously",


    "spill tea anonymously",
    "drop secrets online",
    "anonymous tea page",
    "college tea gossip website",
    "anonymous drama app",
    "expose truth anonymously",
    "tea page anonymous posting",
    "spill secrets app",
    "college confession page anonymous",


    "anonymous voice message app",
    "anonymous audio confession",
    "anonymous board posting platform",
    "no login anonymous social app",
    "private anonymous community app",
    "anonymous group confession app",
    "temporary anonymous posts",
    "anonymous voice note sharing",


    "sites like NGL",
    "apps like Sarahah",
    "anonymous apps like Whisper",
    "NGL alternative anonymous app",
    "best apps for anonymous messaging",
    "anonymous Q&A apps",
    "sendit app alternatives anonymous",

    "anonymous confession website for college students free",
    "send anonymous voice messages without login",
    "post gossip anonymously online free",
    "best anonymous venting platforms 2026",
    "free anonymous message sender no signup",
    "how to create anonymous confession page",
    "anonymous storytelling platform",
    "share secrets with strangers anonymously",
    "write confession without login website",
    "anonymous community for students",


    "reddit like anonymous confession site",
    "anonymous discussion board for college",
    "private gossip sharing platform",
    "anonymous story sharing app",
    "burner style anonymous posting app",
    "dark confessions anonymous website",
    "real stories anonymous platform",
    "uncensored anonymous sharing app"

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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#111",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
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
