import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import { AuthShell } from "./components/AuthShell";
import { DemoBanner } from "./components/DemoBanner";
import { GlobalRail } from "./components/GlobalRail";
import "./globals.css";

// Design system « la preuve d'abord » (refonte 13/07/2026) : Space Grotesk
// pour le texte, IBM Plex Mono pour les chiffres et labels techniques. On
// réutilise les variables historiques --font-geist-* pour que TOUTE l'app
// (dashboard compris) bascule sans churn de classes.
const geistSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// « Command deck » (handoff Modernisation dashboard, 26/07/2026) : IBM Plex
// Sans pour le texte du dashboard uniquement. Chargée ici mais appliquée
// seulement sous `.pf-deck` (globals.css) via un remap de --font-geist-sans,
// pour ne pas toucher la landing / les pages publiques (restées Space Grotesk).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Search-engine ownership verification. Tokens are env-driven so they can be
// rotated/added without a code commit (they're public by design — they end up
// in the <head> — but keeping them in .env.local on the server avoids
// churning the repo). Set GOOGLE_SITE_VERIFICATION / BING_SITE_VERIFICATION
// in prod .env.local, then rebuild (Next reads .env.local at build time).
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION;

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
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification
      ? { other: { "msvalidate.01": bingVerification } }
      : {}),
  },
};

// Sitewide structured data (Schema.org). @graph links three entities:
// OCTOPODUS (the legal publisher), the Port Flow website, and the
// SoftwareApplication itself with its free-tier offer. Helps Google/Bing
// and AI crawlers understand Port Flow is a maritime-intelligence SaaS
// rather than the unrelated edtech e-portfolio homonym.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://portflow.uk/#organization",
      name: "OCTOPODUS",
      alternateName: "Port Flow",
      url: "https://portflow.uk",
      email: "contact@portflow.uk",
      address: {
        "@type": "PostalAddress",
        streetAddress: "21 rue Hippolyte Noiret",
        postalCode: "08300",
        addressLocality: "Rethel",
        addressCountry: "FR",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://portflow.uk/#website",
      url: "https://portflow.uk",
      name: "Port Flow",
      inLanguage: "en",
      publisher: { "@id": "https://portflow.uk/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://portflow.uk/#software",
      name: "Port Flow",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://portflow.uk",
      description:
        "Real-time multi-port AIS tanker intelligence — predicted ETA with a published RMSE benchmark, multi-regime sanctions screening (UKSL, OFAC, UN-SC, EU FSF), chokepoint transit alerts, and dark fleet detection via Sentinel-1 SAR fusion.",
      publisher: { "@id": "https://portflow.uk/#organization" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description:
          "Free tier — full read-only access to all 51 ports and 13 chokepoints.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plexSans.variable} h-full antialiased`}
    >
      {/* lg:pl-[60px] : gouttière gauche pour le rail de navigation global
          (fixed, lg+). pb-[52px] : place pour la barre d'onglets mobile
          (fixed bottom, < lg). */}
      <body className="min-h-full flex flex-col pb-[52px] lg:pb-0 lg:pl-[60px]">
        {/* LCP on the dashboard is a Leaflet basemap tile from CARTO's
            sharded CDN (a–d.basemaps.cartocdn.com). RUM showed the tile as
            the largest element with a slow/variable load. Preconnecting the
            tile hosts removes DNS+TLS+TCP setup from the critical path so the
            first tiles paint sooner. React 19 hoists these <link>s to <head>. */}
        <link
          rel="preconnect"
          href="https://a.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://b.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://c.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://d.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <AuthShell>
          <I18nProvider>
            <GlobalRail />
            <DemoBanner />
            {children}
          </I18nProvider>
        </AuthShell>
      </body>
    </html>
  );
}
