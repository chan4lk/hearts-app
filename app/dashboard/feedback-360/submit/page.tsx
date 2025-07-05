'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
import { Competency, CompetencyLevel, Feedback360FormData } from '@/app/components/shared/types';
import { BsStar, BsStarFill, BsArrowLeft, BsCheckCircle } from 'react-icons/bs';
import { toast } from 'sonner';

export default function FeedbackSubmissionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Feedback360FormData>({
    cycleId: '',
    employeeId: '',
    reviewerId: '',
    reviewerType: 'PEER',
    isAnonymous: false,
    competencyAssessments: [],
    comments: []
  });

  // Data
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);

  const cycleId = searchParams.get('cycleId');
  const employeeId = searchParams.get('employeeId');

  useEffect(() => {
    if (!session) return;
    if (!cycleId || !employeeId) {
      router.push('/dashboard/feedback-360');
      return;
    }
    fetchData();
  }, [session, cycleId, employeeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch competencies
      const competenciesResponse = await fetch('/api/competencies');
      if (competenciesResponse.ok) {
        const competenciesData = await competenciesResponse.json();
        setCompetencies(competenciesData.competencies);
        
        // Initialize form data
        setFormData(prev => ({
          ...prev,
          cycleId: cycleId!,
          employeeId: employeeId!,
          reviewerId: session?.user?.id || '',
          competencyAssessments: competenciesData.competencies.map((comp: Competency) => ({
            competencyId: comp.id,
            levelId: comp.levels?.[0]?.id || '',
            rating: 3,
            comments: ''
          }))
        }));
      }

      // Fetch employee details
      const employeeResponse = await fetch(`/api/users/${employeeId}`);
      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json();
        setEmployee(employeeData.user);
      }

      // Fetch cycle details
      const cycleResponse = await fetch(`/api/feedback-cycles/${cycleId}`);
      if (cycleResponse.ok) {
        const cycleData = await cycleResponse.json();
        setCycle(cycleData.cycle);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load feedback form');
    } finally {
      setLoading(false);
    }
  };

  const handleCompetencyChange = (competencyId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      competencyAssessments: prev.competencyAssessments.map(assessment => 
        assessment.competencyId === competencyId 
          ? { ...assessment, [field]: value }
          : assessment
      )
    }));
  };

  const handleCommentChange = (section: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      comments: prev.comments.map(comment => 
        comment.section === section 
          ? { ...comment, content }
          : comment
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.competencyAssessments.every(assessment => assessment.rating > 0)) {
      toast.error('Please provide ratings for all competencies');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/feedback-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      toast.success('Feedback submitted successfully!');
      router.push('/dashboard/feedback-360');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type={session?.user?.role === 'ADMIN' ? 'admin' : 'manager'}>
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <BsArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Provide 360° Feedback</h1>
              <p className="text-gray-400">
                Reviewing {employee?.name} for {cycle?.name}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Employee Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Employee Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <p className="text-white font-medium">{employee?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Position</label>
                  <p className="text-white font-medium">{employee?.position}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Department</label>
                  <p className="text-white font-medium">{employee?.department}</p>
                </div>
              </div>
            </div>

            {/* Competency Assessments */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Competency Assessment</h2>
              <div className="space-y-6">
                {competencies.map((competency) => {
                  const assessment = formData.competencyAssessments.find(
                    a => a.competencyId === competency.id
                  );
                  
                  return (
                    <CompetencyAssessmentCard
                      key={competency.id}
                      competency={competency}
                      assessment={assessment}
                      onChange={(field, value) => handleCompetencyChange(competency.id, field, value)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Additional Comments</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Strengths
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="What are this person's key strengths?"
                    value={formData.comments.find(c => c.section === 'strengths')?.content || ''}
                    onChange={(e) => handleCommentChange('strengths', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Areas for Improvement
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="What areas could this person improve?"
                    value={formData.comments.find(c => c.section === 'improvements')?.content || ''}
                    onChange={(e) => handleCommentChange('improvements', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Overall Comments
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Any additional comments or observations?"
                    value={formData.comments.find(c => c.section === 'overall')?.content || ''}
                    onChange={(e) => handleCommentChange('overall', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <BsCheckCircle className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Competency Assessment Card Component
function CompetencyAssessmentCard({ 
  competency, 
  assessment, 
  onChange 
}: {
  competency: Competency;
  assessment: any;
  onChange: (field: string, value: any) => void;
}) {
  const [selectedLevel, setSelectedLevel] = useState<CompetencyLevel | null>(
    competency.levels?.find(l => l.id === assessment?.levelId) || null
  );

  const handleLevelChange = (level: CompetencyLevel) => {
    setSelectedLevel(level);
    onChange('levelId', level.id);
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-2">{competency.name}</h3>
        <p className="text-sm text-gray-400">{competency.description}</p>
      </div>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rating (1-5)
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange('rating', rating)}
              className="p-1 hover:scale-110 transition-transform"
            >
              {assessment?.rating >= rating ? (
                <BsStarFill className="w-6 h-6 text-yellow-400" />
              ) : (
                <BsStar className="w-6 h-6 text-gray-400 hover:text-yellow-400" />
              )}
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-400">
            {assessment?.rating || 0}/5
          </span>
        </div>
      </div>

      {/* Competency Levels */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Competency Level
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {competency.levels?.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => handleLevelChange(level)}
              className={`p-3 text-left rounded-lg border transition-all ${
                selectedLevel?.id === level.id
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-600/30 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-medium">{level.name}</div>
              <div className="text-xs text-gray-400 mt-1">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Additional Comments
        </label>
        <textarea
          rows={2}
          className="w-full bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
          placeholder="Any specific observations about this competency..."
          value={assessment?.comments || ''}
          onChange={(e) => onChange('comments', e.target.value)}
        />
      </div>
    </div>
  );
} 