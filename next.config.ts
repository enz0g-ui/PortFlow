import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const SECURITY_HEADERS_BASE = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Generate sourcemaps for production builds so they can be uploaded to Sentry.
  // Without this, Sentry shows minified stack traces.
  productionBrowserSourceMaps: true,
  async redirects() {
    // Canonical host consolidation: both portflow.uk and www.portflow.uk
    // currently return 200 (Cloudflare proxies both to this origin), so
    // Google saw them as duplicates and picked www as canonical — the
    // opposite of the verified (non-www) property. 308 permanent redirect
    // www → non-www collapses the duplicate and points all link equity at
    // the apex. Google honours 308 identically to 301 for canonicalisation.
    // Only the www host matches; clerk.portflow.uk and the apex are untouched.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.portflow.uk" }],
        destination: "https://portflow.uk/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Header rules are applied in order, last match wins per key. So the
    // catch-all comes first with frame-ancestors 'none' (clickjacking
    // protection), then /widget/:path* overrides only the CSP key to permit
    // partner-site embedding. Other security headers carry over from the
    // catch-all since they don't have a competing entry.
    return [
      {
        source: "/:path*",
        headers: [
          ...SECURITY_HEADERS_BASE,
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none';",
          },
        ],
      },
      {
        source: "/widget/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry only when an auth token + org/project are present, so the
// build still works locally without Sentry creds. With creds set in CI/prod,
// `next build` uploads sourcemaps to Sentry and strips them from the public
// build (default behavior).
// Next 16 uses Turbopack — the webpack-only Sentry instrumentation flags
// (`autoInstrumentServerFunctions`, `autoInstrumentMiddleware`, `disableLogger`)
// don't apply, so we omit them. Sentry init lives in sentry.server.config.ts
// / sentry.client.config.ts and is loaded from src/instrumentation.ts.
const sentryWrapped = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Strip the public //# sourceMappingURL comments after upload so the bundle
  // doesn't expose source layout to anonymous browsers — sourcemaps still
  // exist in Sentry, just not at a discoverable URL.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  widenClientFileUpload: true,
});

export default sentryWrapped;
