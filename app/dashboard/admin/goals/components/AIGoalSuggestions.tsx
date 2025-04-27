import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BsStars } from 'react-icons/bs';

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
    <div className="space-y-4">
      <Button
        onClick={generateSuggestions}
        disabled={loading}
        variant="default"
        className="w-full font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-base shadow"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Suggestions...
          </>
        ) : (
          <>
            <BsStars className="h-5 w-5 text-yellow-300" />
            Generate AI Suggestions
          </>
        )}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Suggestions</h3>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{suggestion.title}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {suggestion.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 