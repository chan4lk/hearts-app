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
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400';
      case 'medium':
        return 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400';
      case 'high':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400';
      default:
        return 'from-gray-500/20 to-gray-500/20 border-gray-500/30 text-gray-400';
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
    if (probability >= 70) return 'text-emerald-400';
    if (probability >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className={className}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={analyzeRisk}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <BsShieldExclamation className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
        <span>{loading ? 'Analyzing...' : 'Analyze Risk'}</span>
      </motion.button>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
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
                <p className="text-gray-400 text-xs mb-1">RISK LEVEL</p>
                <p className="text-2xl font-bold text-white capitalize">{analysis.riskLevel} Risk</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs mb-1">COMPLETION PROBABILITY</p>
                <p className={`text-3xl font-bold ${getProbabilityColor(analysis.completionProbability)}`}>
                  {analysis.completionProbability}%
                </p>
              </div>
            </div>
          </div>

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BsExclamationTriangle className="w-4 h-4 text-amber-400" />
                Identified Risks
              </h4>
              <ul className="space-y-2">
                {analysis.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-amber-400 mt-1">•</span>
                    <span className="text-gray-300 text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-5 border border-purple-500/30">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BsCheckCircle className="w-4 h-4 text-purple-400" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span className="text-gray-300 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setShowAnalysis(false)}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Close Analysis
          </button>
        </motion.div>
      )}
    </div>
  );
}

