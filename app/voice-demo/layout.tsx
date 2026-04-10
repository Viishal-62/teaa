import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice Confessions Demo — Record Anonymous Audio",
  description:
    "Try Teaa's anonymous voice confession feature. Record up to 30 seconds with real-time waveform animations and zero metadata stored. Fully anonymous audio confessions.",
  keywords: [
    "voice confession demo",
    "anonymous voice message",
    "record confession audio",
    "audio confession app",
    "anonymous voice recording",
    "voice note anonymous",
    "teaa voice feature",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/voice-demo",
  },
  openGraph: {
    title: "Voice Confessions Demo — Record Anonymous Audio",
    description:
      "Try Teaa's anonymous voice confession feature. Record up to 30 seconds with real-time waveform animations.",
    url: "https://www.teaadrop.xyz/voice-demo",
    type: "website",
  },
};

export default function VoiceDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
