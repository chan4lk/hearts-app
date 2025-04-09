'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressUpdateForm } from '@/components/ProgressUpdateForm';
import { Progress } from '@/components/ui/progress';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  progressNotes: string | null;
  lastProgressUpdate: string | null;
  dueDate: string;
}

export default function TrackProgressPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/employee?status=APPROVED');
      if (!response.ok) throw new Error('Failed to fetch goals');
      
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Track Your Progress</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <CardTitle>{goal.title}</CardTitle>
              <p className="text-sm text-gray-500">
                Due Date: {new Date(goal.dueDate).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-500">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>

              {goal.progressNotes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Latest Update</h3>
                  <p className="text-sm text-gray-600">{goal.progressNotes}</p>
                  {goal.lastProgressUpdate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(goal.lastProgressUpdate).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <ProgressUpdateForm
                goalId={goal.id}
                currentProgress={goal.progress}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 