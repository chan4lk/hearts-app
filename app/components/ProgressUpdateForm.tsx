'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';

interface ProgressUpdateFormProps {
  goalId: string;
  currentProgress: number;
}

export function ProgressUpdateForm({ goalId, currentProgress }: ProgressUpdateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(currentProgress);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      toast.success('Progress updated successfully!');
      router.refresh();
      setNotes('');
    } catch (error) {
      toast.error('Failed to update progress. Please try again.');
      console.error('Error updating progress:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
          Progress (%)
        </label>
        <Input
          id="progress"
          type="number"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Progress Notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe your progress and any challenges faced"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Progress'}
      </Button>
    </form>
  );
} 