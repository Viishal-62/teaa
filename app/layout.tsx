import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import NotificationCenter from "./components/NotificationCenter";

export const metadata: Metadata = {
  title: "Teaa 🫣 — Anonymous Confessions",
  description:
    "Spill it here, don't carry it alone. Create a confession board, share the link, and let people confess anonymously.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
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
      </body>
    </html>
  );
}

