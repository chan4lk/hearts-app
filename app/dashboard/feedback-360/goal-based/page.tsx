'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { Calendar, Users, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface Competency {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function GoalBasedFeedbackPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'QUARTERLY',
    startDate: '',
    endDate: '',
    goalCategory: '',
    includeSelf: true,
    includeManager: true,
    includePeers: true,
    includeSubordinates: false,
    maxPeers: 2
  });

  useEffect(() => {
    fetchGoals();
    fetchCompetencies();
    fetchEmployees();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchCompetencies = async () => {
    try {
      const response = await fetch('/api/competencies');
      if (response.ok) {
        const data = await response.json();
        setCompetencies(data.competencies || []);
      }
    } catch (error) {
      console.error('Error fetching competencies:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateCycle = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedCompetencies.length === 0) {
      toast.error('Please select at least one competency');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        competencyIds: selectedCompetencies,
        goalId: selectedGoals.length === 1 ? selectedGoals[0] : undefined,
        goalCategory: formData.goalCategory || undefined,
        employeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined
      };

      const response = await fetch('/api/feedback-cycles/goal-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Feedback cycle created successfully! ${data.summary.assignmentsCreated} assignments created.`);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          type: 'QUARTERLY',
          startDate: '',
          endDate: '',
          goalCategory: '',
          includeSelf: true,
          includeManager: true,
          includePeers: true,
          includeSubordinates: false,
          maxPeers: 2
        });
        setSelectedGoals([]);
        setSelectedEmployees([]);
        setSelectedCompetencies([]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create feedback cycle');
      }
    } catch (error) {
      console.error('Error creating feedback cycle:', error);
      toast.error('Failed to create feedback cycle');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleCompetencySelection = (competencyId: string) => {
    setSelectedCompetencies(prev => 
      prev.includes(competencyId) 
        ? prev.filter(id => id !== competencyId)
        : [...prev, competencyId]
    );
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goal-Based Feedback Cycles</h1>
          <p className="text-gray-600 mt-2">
            Create 360-degree feedback cycles specifically for employee goals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-500">Goal Integration</span>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Cycle</TabsTrigger>
          <TabsTrigger value="goals">Select Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Cycle Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Cycle Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Q4 2024 Goal Review"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Cycle Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                      <SelectItem value="PROJECT_BASED">Project-based</SelectItem>
                      <SelectItem value="AD_HOC">Ad-hoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose and scope of this feedback cycle..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Goal Targeting</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goalCategory">Goal Category</Label>
                  <Select value={formData.goalCategory} onValueChange={(value) => setFormData({ ...formData, goalCategory: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                      <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="KPI">KPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSelf"
                    checked={formData.includeSelf}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeSelf: checked as boolean })}
                  />
                  <Label htmlFor="includeSelf">Include Self Feedback</Label>
                </div>
              </div>
              
              {selectedGoals.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedGoals.length}</strong> specific goal(s) selected
                  </p>
                </div>
              )}
              
              {formData.goalCategory && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Targeting all <strong>{formData.goalCategory}</strong> goals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Feedback Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeManager"
                    checked={formData.includeManager}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeManager: checked as boolean })}
                  />
                  <Label htmlFor="includeManager">Manager Feedback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePeers"
                    checked={formData.includePeers}
                    onCheckedChange={(checked) => setFormData({ ...formData, includePeers: checked as boolean })}
                  />
                  <Label htmlFor="includePeers">Peer Feedback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSubordinates"
                    checked={formData.includeSubordinates}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeSubordinates: checked as boolean })}
                  />
                  <Label htmlFor="includeSubordinates">Subordinate Feedback (for managers)</Label>
                </div>
                <div>
                  <Label htmlFor="maxPeers">Max Peer Reviewers</Label>
                  <Input
                    id="maxPeers"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.maxPeers}
                    onChange={(e) => setFormData({ ...formData, maxPeers: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Competencies</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {competencies.map((competency) => (
                  <div key={competency.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={competency.id}
                      checked={selectedCompetencies.includes(competency.id)}
                      onCheckedChange={() => toggleCompetencySelection(competency.id)}
                    />
                    <Label htmlFor={competency.id} className="text-sm">
                      {competency.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {competency.category}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
              {selectedCompetencies.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>{selectedCompetencies.length}</strong> competency(ies) selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCycle} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Feedback Cycle'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedGoals.includes(goal.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleGoalSelection(goal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {goal.employee.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {goal.category}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{goal.progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {selectedGoals.includes(goal.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 