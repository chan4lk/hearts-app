'use client';

import { useState, useEffect } from 'react';
import { BsLightbulb, BsCheckCircle, BsExclamationTriangle, BsXCircle, BsStars, BsArrowUp, BsArrowDown, BsDash } from 'react-icons/bs';

interface PerformanceInsight {
  type: 'success' | 'warning' | 'risk' | 'opportunity';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIPerformanceInsightsProps {
  userId?: string;
  autoLoad?: boolean;
  className?: string;
}

const INSIGHT_ICON: Record<string, JSX.Element> = {
  success: <BsCheckCircle className="w-4 h-4 text-success" />,
  warning: <BsExclamationTriangle className="w-4 h-4 text-warning" />,
  risk: <BsXCircle className="w-4 h-4 text-error" />,
  opportunity: <BsLightbulb className="w-4 h-4 text-info" />,
};

const INSIGHT_BG: Record<string, string> = {
  success: 'bg-success-muted dark:bg-[rgb(var(--color-success))]/5',
  warning: 'bg-warning-muted dark:bg-[rgb(var(--color-warning))]/5',
  risk: 'bg-error-muted dark:bg-[rgb(var(--color-error))]/5',
  opportunity: 'bg-info-muted dark:bg-[rgb(var(--color-info))]/5',
};

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-error-muted text-error',
  medium: 'bg-warning-muted text-warning',
  low: 'bg-cat-professional text-info',
};

export default function AIPerformanceInsights({ userId, autoLoad = false, className = '' }: AIPerformanceInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoLoad) loadInsights();
  }, [autoLoad, userId]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/performance-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to load insights');
      const data = await response.json();
      setInsights(data.insights || []);
      setMetrics(data.metrics);
    } catch (err) { // handled silently
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Goals', value: metrics.totalGoals, color: 'text-primary' },
            { label: 'Completion Rate', value: `${metrics.completionRate}%`, color: 'text-success' },
            { label: 'Avg Rating', value: `${metrics.averageRating}/5`, color: 'text-accent' },
          ].map((m, i) => (
            <div key={i} className="bg-surface-secondary rounded-lg px-4 py-3">
              <p className="text-2xs text-secondary uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
          <div className="bg-surface-secondary rounded-lg px-4 py-3">
            <p className="text-2xs text-secondary uppercase tracking-wider mb-1">Trend</p>
            <div className="flex items-center gap-1.5">
              {metrics.recentTrend === 'improving' ? <BsArrowUp className="w-4 h-4 text-success" /> :
               metrics.recentTrend === 'declining' ? <BsArrowDown className="w-4 h-4 text-error" /> :
               <BsDash className="w-4 h-4 text-secondary" />}
              <p className="text-lg font-bold text-primary capitalize">{metrics.recentTrend}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error-muted dark:bg-[rgb(var(--color-error))]/5 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <BsStars className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}

      {/* Insights */}
      {!loading && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className={`rounded-lg p-4 ${INSIGHT_BG[insight.type] || INSIGHT_BG.opportunity}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{INSIGHT_ICON[insight.type] || INSIGHT_ICON.opportunity}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-semibold text-primary">{insight.title}</h4>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-2xs font-semibold uppercase ${PRIORITY_STYLE[insight.priority] || PRIORITY_STYLE.medium}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mb-2.5 leading-relaxed">{insight.description}</p>
                  <div className="bg-surface-secondary rounded-lg px-3 py-2.5">
                    <p className="text-2xs font-semibold text-secondary uppercase tracking-wider mb-1">Recommendation</p>
                    <p className="text-xs text-primary leading-relaxed">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && insights.length === 0 && !error && (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center mx-auto mb-3">
            <BsLightbulb className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-xs text-secondary">No insights available yet</p>
        </div>
      )}
    </div>
  );
}
