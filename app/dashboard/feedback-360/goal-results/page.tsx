'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Star, 
  Users, 
  Calendar, 
  TrendingUp, 
  MessageSquare,
  Award,
  BarChart3
} from 'lucide-react';

interface GoalFeedbackData {
  goal: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    progress: number;
    dueDate: string;
    createdAt: string;
  };
  feedbackCycles: Array<{
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    competencies: Array<{
      id: string;
      name: string;
      category: string;
    }>;
    totalAssignments: number;
    completedFeedbacks: number;
  }>;
  feedbackReceived: Array<{
    id: string;
    cycleName: string;
    reviewerType: string;
    reviewerName: string;
    reviewerRole: string;
    isCompleted: boolean;
    submittedAt: string;
    competencyAssessments: Array<{
      competency: string;
      level: string;
      rating: number;
      comments?: string;
    }>;
    comments: Array<{
      section: string;
      content: string;
      isPrivate: boolean;
    }>;
  }>;
  competencySummary: Record<string, {
    total: number;
    count: number;
    average: number;
    competency: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  totalFeedbackCount: number;
  completedFeedbackCount: number;
}

interface OverallStats {
  totalGoals: number;
  goalsWithFeedback: number;
  totalFeedbackCycles: number;
  totalFeedbackReceived: number;
  completedFeedback: number;
}

export default function GoalFeedbackResultsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [goalFeedbackData, setGoalFeedbackData] = useState<GoalFeedbackData[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');

  useEffect(() => {
    fetchGoalFeedback();
  }, []);

  const fetchGoalFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback-360/goal-feedback');
      if (response.ok) {
        const data = await response.json();
        setGoalFeedbackData(data.goals || []);
        setOverallStats(data.overallStats);
      }
    } catch (error) {
      console.error('Error fetching goal feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReviewerTypeColor = (type: string) => {
    switch (type) {
      case 'SELF': return 'bg-purple-100 text-purple-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'PEER': return 'bg-green-100 text-green-800';
      case 'SUBORDINATE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredGoals = selectedGoal === 'all' 
    ? goalFeedbackData 
    : goalFeedbackData.filter(g => g.goal.id === selectedGoal);

  const getAverageRating = (assessments: any[]) => {
    if (assessments.length === 0) return 0;
    const total = assessments.reduce((sum, a) => sum + a.rating, 0);
    return Math.round((total / assessments.length) * 10) / 10;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading goal feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goal-Based Feedback Results</h1>
          <p className="text-gray-600 mt-2">
            View feedback related to your goals and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-500">Goal Integration</span>
        </div>
      </div>

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Goals</p>
                  <p className="text-2xl font-bold">{overallStats.totalGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Goals with Feedback</p>
                  <p className="text-2xl font-bold">{overallStats.goalsWithFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Feedback Cycles</p>
                  <p className="text-2xl font-bold">{overallStats.totalFeedbackCycles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed Feedback</p>
                  <p className="text-2xl font-bold">{overallStats.completedFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Filter by Goal</label>
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="All Goals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {goalFeedbackData.map(goal => (
                    <SelectItem key={goal.goal.id} value={goal.goal.id}>
                      {goal.goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Filter by Cycle</label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="All Cycles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {goalFeedbackData.flatMap(g => g.feedbackCycles).map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals and Feedback */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Feedback</TabsTrigger>
          <TabsTrigger value="competencies">Competency Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {filteredGoals.map((goalData) => (
            <Card key={goalData.goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>{goalData.goal.title}</span>
                      <Badge className={getStatusColor(goalData.goal.status)}>
                        {goalData.goal.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-gray-600 mt-2">{goalData.goal.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{goalData.goal.progress}%</p>
                  </div>
                </div>
                <Progress value={goalData.goal.progress} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Feedback Cycles */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Related Feedback Cycles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {goalData.feedbackCycles.map((cycle) => (
                      <div key={cycle.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm">{cycle.name}</h5>
                          <Badge variant="outline" className="text-xs">
                            {cycle.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>Competencies: {cycle.competencies.length}</p>
                          <p>Completed: {cycle.completedFeedbacks}/{cycle.totalAssignments}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Feedback Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Feedback Summary</h4>
                  <div className="space-y-2">
                    {goalData.feedbackReceived.slice(0, 3).map((feedback) => (
                      <div key={feedback.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={getReviewerTypeColor(feedback.reviewerType)}>
                            {feedback.reviewerType}
                          </Badge>
                          <span className="text-sm">{feedback.reviewerName}</span>
                          <span className="text-xs text-gray-500">({feedback.cycleName})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {feedback.competencyAssessments.length} competencies
                          </span>
                          {feedback.isCompleted && (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {filteredGoals.map((goalData) => (
            <Card key={goalData.goal.id}>
              <CardHeader>
                <CardTitle>{goalData.goal.title} - Detailed Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goalData.feedbackReceived.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={getReviewerTypeColor(feedback.reviewerType)}>
                            {feedback.reviewerType}
                          </Badge>
                          <span className="font-medium">{feedback.reviewerName}</span>
                          <span className="text-sm text-gray-500">({feedback.cycleName})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Avg: {getAverageRating(feedback.competencyAssessments)}
                          </span>
                          {feedback.isCompleted && (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          )}
                        </div>
                      </div>

                      {/* Competency Assessments */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {feedback.competencyAssessments.map((assessment, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{assessment.competency}</span>
                              <div className="flex items-center space-x-1">
                                <span className={`font-bold ${getRatingColor(assessment.rating)}`}>
                                  {assessment.rating}
                                </span>
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">{assessment.level}</p>
                            {assessment.comments && (
                              <p className="text-xs text-gray-700 mt-1">{assessment.comments}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Comments */}
                      {feedback.comments.length > 0 && (
                        <div className="space-y-2">
                          {feedback.comments.map((comment, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium capitalize">{comment.section}</span>
                                {comment.isPrivate && (
                                  <Badge variant="outline" className="text-xs">Private</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="competencies" className="space-y-6">
          {filteredGoals.map((goalData) => (
            <Card key={goalData.goal.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>{goalData.goal.title} - Competency Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(goalData.competencySummary).map(([competencyName, data]) => (
                    <div key={competencyName} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{competencyName}</h4>
                        <div className="flex items-center space-x-1">
                          <span className={`font-bold text-lg ${getRatingColor(data.average)}`}>
                            {data.average}
                          </span>
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Based on {data.count} assessments</p>
                        <p>Category: {data.competency.category}</p>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(data.average / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round((data.average / 5) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 