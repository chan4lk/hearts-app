'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ratingSchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface Employee {
  id: string;
  name: string;
  email: string;
  goals: {
    id: string;
    title: string;
    description: string;
    selfRating?: {
      score: number;
      comment?: string;
    };
    managerRating?: {
      score: number;
      comment?: string;
    };
  }[];
}

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Employee['goals'][0] | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
  });

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchEmployees();
  }, [session, router]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedGoal(null);
    reset();
  };

  const handleGoalSelect = (goal: Employee['goals'][0]) => {
    setSelectedGoal(goal);
    reset({
      score: goal.managerRating?.score || 3,
      comment: goal.managerRating?.comment || '',
    });
  };

  const onSubmit = async (data: RatingFormData) => {
    if (!selectedEmployee || !selectedGoal) return;

    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}/manager-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to submit rating');

      fetchEmployees();
      setSelectedGoal(null);
      reset();
    } catch (err) {
      setError('Failed to submit rating');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Employees</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Team</h3>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-300 ${
                        selectedEmployee?.id === employee.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <h4 className="text-lg font-medium text-gray-900">{employee.name}</h4>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEmployee && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedEmployee.name}'s Goals
                  </h3>
                  <div className="space-y-4">
                    {selectedEmployee.goals.map((goal) => (
                      <div
                        key={goal.id}
                        className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-300 ${
                          selectedGoal?.id === goal.id ? 'ring-2 ring-indigo-500' : ''
                        }`}
                        onClick={() => handleGoalSelect(goal)}
                      >
                        <h4 className="text-lg font-medium text-gray-900">{goal.title}</h4>
                        <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
                        {goal.selfRating && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Self Rating: {goal.selfRating.score}/5
                            </p>
                            {goal.selfRating.comment && (
                              <p className="text-sm text-gray-500 mt-1">
                                Self Comment: {goal.selfRating.comment}
                              </p>
                            )}
                          </div>
                        )}
                        {goal.managerRating && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Your Rating: {goal.managerRating.score}/5
                            </p>
                            {goal.managerRating.comment && (
                              <p className="text-sm text-gray-500 mt-1">
                                Your Comment: {goal.managerRating.comment}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedGoal && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Rate: {selectedGoal.title}
                  </h3>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                        Rating (1-5)
                      </label>
                      <select
                        {...register('score', { valueAsNumber: true })}
                        id="score"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="1">1 - Needs Improvement</option>
                        <option value="2">2 - Below Expectations</option>
                        <option value="3">3 - Meets Expectations</option>
                        <option value="4">4 - Exceeds Expectations</option>
                        <option value="5">5 - Outstanding</option>
                      </select>
                      {errors.score && (
                        <p className="mt-1 text-sm text-red-600">{errors.score.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                        Comment (Optional)
                      </label>
                      <textarea
                        {...register('comment')}
                        id="comment"
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      {errors.comment && (
                        <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
                      )}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 