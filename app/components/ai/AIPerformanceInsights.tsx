'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BsLightbulb, 
  BsCheckCircle, 
  BsExclamationTriangle, 
  BsXCircle, 
  BsStars,
  BsArrowUp,
  BsArrowDown,
  BsDash
} from 'react-icons/bs';

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

export default function AIPerformanceInsights({ 
  userId, 
  autoLoad = false,
  className = '' 
}: AIPerformanceInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoLoad) {
      loadInsights();
    }
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

      if (!response.ok) {
        throw new Error('Failed to load insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <BsCheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <BsExclamationTriangle className="w-5 h-5 text-amber-400" />;
      case 'risk':
        return <BsXCircle className="w-5 h-5 text-red-400" />;
      case 'opportunity':
        return <BsLightbulb className="w-5 h-5 text-blue-400" />;
      default:
        return <BsStars className="w-5 h-5 text-purple-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30';
      case 'warning':
        return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
      case 'risk':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      case 'opportunity':
        return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      default:
        return 'from-purple-500/20 to-indigo-500/20 border-purple-500/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <BsArrowUp className="w-4 h-4 text-emerald-400" />;
      case 'declining':
        return <BsArrowDown className="w-4 h-4 text-red-400" />;
      default:
        return <BsDash className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BsStars className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">AI Performance Insights</h3>
        </div>
        {!autoLoad && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadInsights}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Insights'}
          </motion.button>
        )}
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Total Goals</p>
            <p className="text-2xl font-bold text-white">{metrics.totalGoals}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-emerald-400">{metrics.completionRate}%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Avg Rating</p>
            <p className="text-2xl font-bold text-purple-400">{metrics.averageRating}/5</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {getTrendIcon(metrics.recentTrend)}
              <p className="text-lg font-bold text-white capitalize">{metrics.recentTrend}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <BsStars className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Insights List */}
      {!loading && insights.length > 0 && (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-r ${getInsightColor(insight.type)} rounded-lg p-5 border`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-white font-semibold">{insight.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(insight.priority)}`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">RECOMMENDATION</p>
                    <p className="text-white text-sm">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && insights.length === 0 && !error && (
        <div className="text-center py-12">
          <BsLightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No insights available yet. Click "Refresh Insights" to generate.</p>
        </div>
      )}
    </div>
  );
}

