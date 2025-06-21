import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BsStars, BsLightning, BsRobot } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

interface AIGoalSuggestionsProps {
  category: string;
  onSuggestionSelect: (suggestion: { title: string; description: string }) => void;
  context?: string;
}

export function AIGoalSuggestions({
  category,
  onSuggestionSelect,
  context
}: AIGoalSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; description: string }[]>([]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate goal suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Button
          onClick={generateSuggestions}
          disabled={loading}
          variant="default"
          className="group relative w-full py-6 font-semibold flex items-center justify-center gap-3 
            bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
            dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 
            text-white text-base rounded-2xl overflow-hidden transition-all duration-300
            border border-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl"
        >
          {/* Button Background Animation */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="relative">
                Generating
                <span className="absolute -right-4 animate-pulse">...</span>
              </span>
            </>
          ) : (
            <>
              <div className="relative">
                <BsStars className="h-5 w-5 text-yellow-300 animate-pulse" />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-yellow-300/30 blur-xl rounded-full"
                />
              </div>
              <span>Generate AI Suggestions</span>
              <BsRobot className="h-4 w-4 text-blue-200 group-hover:animate-bounce" />
            </>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              AI Generated Suggestions
            </h3>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSuggestionSelect(suggestion)}
                className="group relative p-4 border border-white/10 rounded-xl 
                  bg-gradient-to-r from-white/5 to-white/10 dark:from-gray-800/50 dark:to-gray-700/50
                  backdrop-blur-lg hover:backdrop-blur-xl cursor-pointer
                  transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Card Hover Effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl" />

                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <BsLightning className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-transparent 
                      group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                      transition-all duration-300">{suggestion.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 