'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsShieldExclamation, BsCheckCircle, BsExclamationTriangle, BsXCircle } from 'react-icons/bs';

interface GoalRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  completionProbability: number;
  risks: string[];
  recommendations: string[];
}

interface AIGoalRiskAnalysisProps {
  goalId: string;
  className?: string;
}

export default function AIGoalRiskAnalysis({ goalId, className = '' }: AIGoalRiskAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GoalRiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeRisk = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/goal-risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze goal risk');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setShowAnalysis(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze risk');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'from-[rgb(var(--color-success))]/20 to-[rgba(var(--color-success),0.2)] border-[rgb(var(--color-success))]/30 text-success';
      case 'medium':
        return 'from-[rgba(var(--color-warning),0.2)] to-[rgba(var(--color-warning),0.1)] border-[rgba(var(--color-warning),0.3)] text-warning';
      case 'high':
        return 'from-[rgba(var(--color-error),0.2)] to-[rgba(var(--color-error),0.2)] border-[rgb(var(--color-error))]/30 text-error';
      default:
        return 'from-surface-tertiary/20 to-surface-tertiary/20 border-theme text-secondary';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <BsCheckCircle className="w-6 h-6" />;
      case 'medium':
        return <BsExclamationTriangle className="w-6 h-6" />;
      case 'high':
        return <BsXCircle className="w-6 h-6" />;
      default:
        return <BsShieldExclamation className="w-6 h-6" />;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-success';
    if (probability >= 40) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className={className}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={analyzeRisk}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[rgb(var(--color-rating-2))] to-[rgb(var(--color-error))] text-[rgb(var(--color-text-inverse))] rounded-lg hover:from-[rgb(var(--color-rating-2))] hover:to-[rgb(var(--color-error))] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <BsShieldExclamation className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
        <span>{loading ? 'Analyzing...' : 'Analyze Risk'}</span>
      </motion.button>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-error-muted border border-[rgba(var(--color-error),0.2)] rounded-lg"
        >
          <p className="text-error text-sm">{error}</p>
        </motion.div>
      )}

      {/* Analysis Results */}
      {showAnalysis && analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-4"
        >
          {/* Risk Level Card */}
          <div className={`bg-gradient-to-r ${getRiskColor(analysis.riskLevel)} rounded-lg p-5 border`}>
            <div className="flex items-center gap-4">
              <div className={getRiskColor(analysis.riskLevel).split(' ').pop()}>
                {getRiskIcon(analysis.riskLevel)}
              </div>
              <div className="flex-1">
                <p className="text-secondary text-xs mb-1">RISK LEVEL</p>
                <p className="text-2xl font-bold text-primary capitalize">{analysis.riskLevel} Risk</p>
              </div>
              <div className="text-right">
                <p className="text-secondary text-xs mb-1">COMPLETION PROBABILITY</p>
                <p className={`text-3xl font-bold ${getProbabilityColor(analysis.completionProbability)}`}>
                  {analysis.completionProbability}%
                </p>
              </div>
            </div>
          </div>

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div className="bg-surface-secondary rounded-lg p-5 border border-theme">
              <h4 className="text-primary font-semibold mb-3 flex items-center gap-2">
                <BsExclamationTriangle className="w-4 h-4 text-warning" />
                Identified Risks
              </h4>
              <ul className="space-y-2">
                {analysis.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-warning mt-1">•</span>
                    <span className="text-secondary text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-[rgb(var(--color-cat-technical))]/10 to-[rgb(var(--color-accent))]/10 rounded-lg p-5 border border-[rgb(var(--color-cat-technical))]/30">
              <h4 className="text-primary font-semibold mb-3 flex items-center gap-2">
                <BsCheckCircle className="w-4 h-4 text-cat-technical" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-cat-technical mt-1">✓</span>
                    <span className="text-secondary text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setShowAnalysis(false)}
            className="w-full px-4 py-2 bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary rounded-lg transition-colors text-sm"
          >
            Close Analysis
          </button>
        </motion.div>
      )}
    </div>
  );
}

