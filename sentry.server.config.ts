import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
    sendDefaultPii: false,
    ignoreErrors: [
      /Failed to find Server Action/i,
      /invalid signature/i,
    ],
    beforeSend(event) {
      const msg = event.exception?.values?.[0]?.value ?? "";
      if (/unauthenticated|unauthorized/i.test(msg)) return null;
      return event;
    },
  });
  console.log("[sentry] server config loaded");
}
