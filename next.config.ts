import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate sourcemaps for production builds so they can be uploaded to Sentry.
  // Without this, Sentry shows minified stack traces.
  productionBrowserSourceMaps: true,
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
