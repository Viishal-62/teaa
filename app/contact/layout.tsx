import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Get in Touch with Teaa",
  description:
    "Have questions, feedback, or need to report an issue? Reach out to the Teaa team. We typically respond within 24-48 hours.",
  keywords: [
    "contact teaa",
    "teaa support",
    "teaadrop contact",
    "report confession issue",
    "teaa help",
    "anonymous app support",
    "teaa feedback",
  ],
  alternates: {
    canonical: "https://www.teaadrop.xyz/contact",
  },
  openGraph: {
    title: "Contact Us — Get in Touch with Teaa",
    description:
      "Have questions, feedback, or need to report an issue? Reach out to the Teaa team.",
    url: "https://www.teaadrop.xyz/contact",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
