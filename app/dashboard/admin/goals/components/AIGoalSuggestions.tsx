import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Suggestions...
          </>
        ) : (
          'Generate AI Suggestions'
        )}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">AI Suggestions</h3>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              <h4 className="font-medium">{suggestion.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {suggestion.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 