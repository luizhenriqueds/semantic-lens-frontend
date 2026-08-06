import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    // iOS in-app browsers (Instagram/Facebook ad redirects) inject a partial
    // `window.webkit.messageHandlers` that scripts on the page probe for; harmless, not our bug.
    /webkit\.messageHandlers/,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
