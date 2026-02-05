/**
 * Performance Monitoring Utilities
 * Tracks query performance and alerts on slow queries
 */

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: Date;
  slow: boolean;
}

interface ApiMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  slow: boolean;
}

// In-memory storage for metrics (use persistent storage in production)
const queryMetrics: QueryMetric[] = [];
const apiMetrics: ApiMetric[] = [];

const SLOW_QUERY_THRESHOLD = 5000; // 5 seconds
const SLOW_API_THRESHOLD = 3000; // 3 seconds
const MAX_METRICS_STORED = 10000;

/**
 * Record a database query metric
 */
export function recordQueryMetric(query: string, duration: number) {
  const isSlow = duration > SLOW_QUERY_THRESHOLD;

  const metric: QueryMetric = {
    query: sanitizeQuery(query),
    duration,
    timestamp: new Date(),
    slow: isSlow,
  };

  queryMetrics.push(metric);

  // Keep only recent metrics
  if (queryMetrics.length > MAX_METRICS_STORED) {
    queryMetrics.shift();
  }

  // Log slow queries
  if (isSlow) {
    console.warn(`⚠️ SLOW QUERY: ${query} took ${duration}ms`);
  }

  return metric;
}

/**
 * Record an API endpoint metric
 */
export function recordApiMetric(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) {
  const isSlow = duration > SLOW_API_THRESHOLD;

  const metric: ApiMetric = {
    endpoint,
    method,
    duration,
    statusCode,
    timestamp: new Date(),
    slow: isSlow,
  };

  apiMetrics.push(metric);

  // Keep only recent metrics
  if (apiMetrics.length > MAX_METRICS_STORED) {
    apiMetrics.shift();
  }

  // Log slow APIs
  if (isSlow) {
    console.warn(
      `⚠️ SLOW API: ${method} ${endpoint} took ${duration}ms (${statusCode})`
    );
  }

  return metric;
}

/**
 * Get all slow queries
 */
export function getSlowQueries(threshold?: number): QueryMetric[] {
  const limit = threshold || SLOW_QUERY_THRESHOLD;
  return queryMetrics.filter(m => m.duration > limit);
}

/**
 * Get all slow API calls
 */
export function getSlowApis(threshold?: number): ApiMetric[] {
  const limit = threshold || SLOW_API_THRESHOLD;
  return apiMetrics.filter(m => m.duration > limit);
}

/**
 * Get query performance statistics
 */
export function getQueryStats() {
  if (queryMetrics.length === 0) {
    return {
      totalQueries: 0,
      slowQueries: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
    };
  }

  const durations = queryMetrics.map(m => m.duration).sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  return {
    totalQueries: queryMetrics.length,
    slowQueries: queryMetrics.filter(m => m.slow).length,
    avgDuration: Math.round(avg),
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p50Duration: p50,
    p95Duration: p95,
    p99Duration: p99,
  };
}

/**
 * Get API performance statistics
 */
export function getApiStats() {
  if (apiMetrics.length === 0) {
    return {
      totalRequests: 0,
      slowRequests: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      by2xx: 0,
      by4xx: 0,
      by5xx: 0,
    };
  }

  const durations = apiMetrics.map(m => m.duration).sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  const statusCodeCounts = apiMetrics.reduce(
    (acc, m) => {
      if (m.statusCode >= 200 && m.statusCode < 300) acc.by2xx++;
      else if (m.statusCode >= 400 && m.statusCode < 500) acc.by4xx++;
      else if (m.statusCode >= 500) acc.by5xx++;
      return acc;
    },
    { by2xx: 0, by4xx: 0, by5xx: 0 }
  );

  return {
    totalRequests: apiMetrics.length,
    slowRequests: apiMetrics.filter(m => m.slow).length,
    avgDuration: Math.round(avg),
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p50Duration: p50,
    p95Duration: p95,
    p99Duration: p99,
    ...statusCodeCounts,
  };
}

/**
 * Get top slow queries
 */
export function getTopSlowQueries(limit: number = 10): QueryMetric[] {
  return queryMetrics
    .filter(m => m.slow)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

/**
 * Get top slow APIs
 */
export function getTopSlowApis(limit: number = 10): ApiMetric[] {
  return apiMetrics
    .filter(m => m.slow)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

/**
 * Get metrics for a specific time range
 */
export function getMetricsInTimeRange(
  startTime: Date,
  endTime: Date
): {
  queries: QueryMetric[];
  apis: ApiMetric[];
} {
  return {
    queries: queryMetrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    ),
    apis: apiMetrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    ),
  };
}

/**
 * Get metrics summary for dashboard
 */
export function getMetricsSummary() {
  return {
    queries: getQueryStats(),
    apis: getApiStats(),
    topSlowQueries: getTopSlowQueries(5),
    topSlowApis: getTopSlowApis(5),
  };
}

/**
 * Clear all metrics (use with caution)
 */
export function clearMetrics() {
  queryMetrics.length = 0;
  apiMetrics.length = 0;
}

/**
 * Export metrics to JSON for external analysis
 */
export function exportMetrics() {
  return {
    queries: queryMetrics,
    apis: apiMetrics,
    summary: getMetricsSummary(),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Sanitize query string (remove sensitive data)
 */
function sanitizeQuery(query: string): string {
  // Remove sensitive patterns but keep structure for grouping
  return query
    .replace(/['"][^'"]*['"]/g, '?') // Replace string literals
    .replace(/\d+/g, '?') // Replace numbers
    .substring(0, 200); // Limit length
}

/**
 * Middleware to wrap API endpoints with performance monitoring
 */
export function withPerformanceTracking(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const startTime = performance.now();

    try {
      const response = await handler(req, ...args);
      const duration = Math.round(performance.now() - startTime);

      recordApiMetric(
        req.url,
        req.method,
        duration,
        response.status
      );

      // Add performance headers to response
      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${duration}ms`);

      if (duration > SLOW_API_THRESHOLD) {
        headers.set('X-Performance-Alert', 'true');
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      recordApiMetric(
        req.url,
        req.method,
        duration,
        500
      );

      throw error;
    }
  };
}

/**
 * Generate performance report
 */
export function generatePerformanceReport() {
  const queryStats = getQueryStats();
  const apiStats = getApiStats();

  const report = `
╔════════════════════════════════════════════════════════════════╗
║              PERFORMANCE MONITORING REPORT                     ║
╚════════════════════════════════════════════════════════════════╝

📊 DATABASE QUERY METRICS:
  • Total Queries: ${queryStats.totalQueries}
  • Slow Queries: ${queryStats.slowQueries} (>${SLOW_QUERY_THRESHOLD}ms)
  • Average Duration: ${queryStats.avgDuration}ms
  • Min/Max Duration: ${queryStats.minDuration}ms / ${queryStats.maxDuration}ms
  • P50: ${queryStats.p50Duration}ms
  • P95: ${queryStats.p95Duration}ms
  • P99: ${queryStats.p99Duration}ms

🌐 API ENDPOINT METRICS:
  • Total Requests: ${apiStats.totalRequests}
  • Slow Requests: ${apiStats.slowRequests} (>${SLOW_API_THRESHOLD}ms)
  • Average Duration: ${apiStats.avgDuration}ms
  • Min/Max Duration: ${apiStats.minDuration}ms / ${apiStats.maxDuration}ms
  • P50: ${apiStats.p50Duration}ms
  • P95: ${apiStats.p95Duration}ms
  • P99: ${apiStats.p99Duration}ms
  • 2xx Responses: ${apiStats.by2xx}
  • 4xx Responses: ${apiStats.by4xx}
  • 5xx Responses: ${apiStats.by5xx}

⚠️ TOP SLOW QUERIES:
${getTopSlowQueries(5)
  .map(
    (q, i) =>
      `  ${i + 1}. ${q.duration}ms - ${q.query.substring(0, 60)}...`
  )
  .join('\n')}

⚠️ TOP SLOW APIS:
${getTopSlowApis(5)
  .map(
    (a, i) =>
      `  ${i + 1}. ${a.duration}ms - ${a.method} ${a.endpoint}`
  )
  .join('\n')}

Generated: ${new Date().toISOString()}
  `;

  return report;
}
