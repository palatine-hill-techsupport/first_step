import type { Metadata } from "next";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "./globals.css";

const deploymentBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const faviconPath = `${deploymentBasePath}/brand/ico.ico`;

export const metadata: Metadata = {
  title: {
    default: "first_step — practical next steps",
    template: "%s · first_step",
  },
  description: "Find a practical next step into support, study, paid work or stability. No life story required.",
  icons: {
    icon: faviconPath,
    shortcut: faviconPath,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "first_step — The hardest step is always the first.",
    description: "Practical next steps into support, study, paid work or stability.",
    type: "website",
    images: [{ url: "/og-review-updates.png", width: 1730, height: 909, alt: "first_step — One useful step. On your terms. Support, study, work and referrals." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "first_step — The hardest step is always the first.",
    description: "Practical help. No life story required.",
    images: ["/og-review-updates.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
