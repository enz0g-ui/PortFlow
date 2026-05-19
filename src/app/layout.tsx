import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import { AuthShell } from "./components/AuthShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://portflow.uk"),
  title: {
    default: "Port Flow · tanker intelligence",
    template: "%s · Port Flow",
  },
  description:
    "Real-time multi-port AIS — predicted ETA vs broadcast benchmark, sanctions screening, chokepoint transit alerts. Built for commodity traders, freight forwarders, P&I underwriters.",
  applicationName: "Port Flow",
  openGraph: {
    type: "website",
    siteName: "Port Flow",
    title: "Port Flow · tanker intelligence",
    description:
      "Real-time AIS across 51 ports — predicted ETA vs broadcast benchmark, sanctions screening, chokepoint transit alerts.",
    url: "https://portflow.uk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Port Flow · tanker intelligence",
    description:
      "Real-time AIS across 51 ports — predicted ETA vs broadcast benchmark, sanctions screening, chokepoint transit alerts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthShell>
          <I18nProvider>{children}</I18nProvider>
        </AuthShell>
      </body>
    </html>
  );
}
