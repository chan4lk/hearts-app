/**
 * Server-side logger with Azure Application Insights integration.
 *
 * Initializes once per process. If APPLICATIONINSIGHTS_CONNECTION_STRING
 * (or legacy APPINSIGHTS_INSTRUMENTATIONKEY) is set and we're in a Node
 * runtime, errors and events are shipped to App Insights. Otherwise falls
 * back to structured JSON console output.
 *
 * Import only from server-side code (API routes, server components,
 * lib/*). next.config.js already strips applicationinsights from
 * client/middleware bundles via IgnorePlugin.
 */

type LogContext = Record<string, unknown> | undefined;

interface TelemetryClient {
  trackException(opts: { exception: Error; properties?: Record<string, unknown> }): void;
  trackEvent(opts: { name: string; properties?: Record<string, unknown> }): void;
  trackTrace(opts: { message: string; severity?: number; properties?: Record<string, unknown> }): void;
  flush(): void;
}

let client: TelemetryClient | null = null;
let initAttempted = false;

function initOnce() {
  if (initAttempted) return;
  initAttempted = true;

  if (typeof window !== 'undefined') return; // browser — no-op

  const connStr =
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
    process.env.APPINSIGHTS_CONNECTION_STRING;
  const instrKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

  if (!connStr && !instrKey) return;

  try {
    // Dynamic require keeps this out of edge/client bundles.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appInsights = require('applicationinsights');
    const setup = connStr ? appInsights.setup(connStr) : appInsights.setup(instrKey);
    setup
      .setAutoCollectRequests(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectConsole(false) // we ship our own trackTrace calls
      .setSendLiveMetrics(false)
      .start();
    client = appInsights.defaultClient as TelemetryClient;
  } catch (err) {
    // Never let logger init crash the app.
    // eslint-disable-next-line no-console
    console.error('[logger] failed to initialize App Insights', err);
    client = null;
  }
}

function serializeContext(ctx: LogContext): Record<string, unknown> {
  if (!ctx) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v === undefined) continue;
    if (v instanceof Error) {
      out[k] = { message: v.message, name: v.name, stack: v.stack };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function consoleFallback(level: 'error' | 'warn' | 'info', message: string, ctx: LogContext) {
  const payload = { level, message, timestamp: new Date().toISOString(), ...serializeContext(ctx) };
  // eslint-disable-next-line no-console
  console[level](JSON.stringify(payload));
}

export const logger = {
  error(message: string, ctx?: LogContext) {
    initOnce();
    if (client) {
      const exception =
        ctx?.error instanceof Error
          ? ctx.error
          : new Error(message);
      client.trackException({
        exception,
        properties: { message, ...serializeContext(ctx) },
      });
      return;
    }
    consoleFallback('error', message, ctx);
  },

  warn(message: string, ctx?: LogContext) {
    initOnce();
    if (client) {
      client.trackTrace({ message, severity: 2, properties: serializeContext(ctx) });
      return;
    }
    consoleFallback('warn', message, ctx);
  },

  info(message: string, ctx?: LogContext) {
    initOnce();
    if (client) {
      client.trackTrace({ message, severity: 1, properties: serializeContext(ctx) });
      return;
    }
    consoleFallback('info', message, ctx);
  },

  event(name: string, ctx?: LogContext) {
    initOnce();
    if (client) {
      client.trackEvent({ name, properties: serializeContext(ctx) });
      return;
    }
    consoleFallback('info', `event:${name}`, ctx);
  },
};
