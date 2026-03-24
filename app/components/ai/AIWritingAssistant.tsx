'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsStars, BsArrowRepeat, BsCheckCircle } from 'react-icons/bs';

interface AIWritingAssistantProps {
  text: string;
  type: 'manager_comment' | 'self_rating' | 'goal_description';
  onImprove: (improvedText: string) => void;
  className?: string;
}

export default function AIWritingAssistant({ 
  text, 
  type, 
  onImprove, 
  className = '' 
}: AIWritingAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState<string | null>(null);
  const [tone, setTone] = useState<'constructive' | 'encouraging' | 'professional'>('professional');
  const [showComparison, setShowComparison] = useState(false);

  const improveFeedback = async () => {
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/improve-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type, tone })
      });

      if (!response.ok) {
        throw new Error('Failed to improve text');
      }

      const data = await response.json();
      setImproved(data.improved);
      setShowComparison(true);
    } catch (err) { // handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (improved) {
      onImprove(improved);
      setShowComparison(false);
      setImproved(null);
    }
  };

  const handleReject = () => {
    setShowComparison(false);
    setImproved(null);
  };

  return (
    <div className={className}>
      {/* Control Panel */}
      <div className="flex items-center gap-3 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={improveFeedback}
          disabled={loading || !text.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-[rgb(var(--color-text-inverse))] rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <BsStars className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Improving...' : 'AI Improve'}</span>
        </motion.button>

        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as any)}
          className="px-3 py-2 input-theme rounded-lg focus:border-purple-500 focus:outline-none text-sm"
        >
          <option value="professional">Professional</option>
          <option value="constructive">Constructive</option>
          <option value="encouraging">Encouraging</option>
        </select>
      </div>

      {/* Comparison View */}
      {showComparison && improved && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-surface-secondary rounded-lg border border-purple-500/30 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-3 border-b border-purple-500/30">
            <h4 className="text-primary font-medium flex items-center gap-2">
              <BsStars className="w-4 h-4 text-purple-400" />
              AI Suggestion
            </h4>
          </div>

          <div className="p-4 space-y-4">
            {/* Original */}
            <div>
              <p className="text-secondary text-xs font-medium mb-2">ORIGINAL</p>
              <div className="bg-surface-elevated rounded-lg p-3 border border-theme">
                <p className="text-secondary text-sm">{text}</p>
              </div>
            </div>

            {/* Improved */}
            <div>
              <p className="text-purple-400 text-xs font-medium mb-2">IMPROVED</p>
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
                <p className="text-primary text-sm">{improved}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAccept}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-[rgb(var(--color-text-inverse))] rounded-lg transition-colors text-sm"
              >
                <BsCheckCircle className="w-4 h-4" />
                <span>Use Improved Version</span>
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary rounded-lg transition-colors text-sm"
              >
                <BsArrowRepeat className="w-4 h-4" />
                <span>Keep Original</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

