import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // middleware.ts runs on this runtime for nearly every request; sampling traces there is
  // all cost for no signal, so tracing stays off and only errors report.
  tracesSampleRate: 0,
});
