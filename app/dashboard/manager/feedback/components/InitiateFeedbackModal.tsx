'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BsX,
  BsChatDots,
  BsPerson,
  BsListCheck,
  BsPeople,
  BsArrowLeft,
  BsArrowRight,
  BsCheckCircle,
  BsCalendarCheck,
  BsCalendar3,
} from 'react-icons/bs';

interface InitiateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

export default function InitiateFeedbackModal({ isOpen, onClose, onSuccess }: InitiateFeedbackModalProps) {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedEmployee('');
      setSelectedType('');
      setSelectedReviewers([]);
      setReviewerSearch('');
      fetchEmployees();
    }
  }, [isOpen]);

  // Fetch reviewers when employee is selected and we move to step 3
  useEffect(() => {
    if (selectedEmployee && step === 3) {
      fetchReviewers();
    }
  }, [selectedEmployee, step]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetch('/api/employees/assigned');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchReviewers = async () => {
    setLoadingReviewers(true);
    try {
      const response = await fetch(`/api/feedback-rounds/reviewers?employeeId=${selectedEmployee}`);
      if (!response.ok) throw new Error('Failed to fetch reviewers');
      const data = await response.json();
      const allReviewers: Reviewer[] = Array.isArray(data) ? data : data.reviewers || [];
      // Exclude the selected employee from the reviewer list
      setReviewers(allReviewers.filter((r) => r.id !== selectedEmployee));
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      toast.error('Failed to load reviewers');
    } finally {
      setLoadingReviewers(false);
    }
  };

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId) ? prev.filter((id) => id !== reviewerId) : [...prev, reviewerId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReviewers.length < 3) {
      toast.error('Please select at least 3 reviewers');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback-rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          type: selectedType,
          reviewerIds: selectedReviewers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create feedback round');
      }

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create feedback round';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!selectedEmployee;
    if (step === 2) return !!selectedType;
    if (step === 3) return selectedReviewers.length >= 3;
    return false;
  };

  const selectedEmployeeData = employees.find((e) => e.id === selectedEmployee);

  const filteredReviewers = reviewers.filter(
    (r) =>
      reviewerSearch === '' ||
      r.name.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(reviewerSearch.toLowerCase())
  );

  const stepLabels = ['Select Employee', 'Review Type', 'Select Reviewers'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center gap-2">
                <BsChatDots className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <h2 className="text-base font-bold text-white">Initiate 360 Review</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <BsX className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                {stepLabels.map((label, i) => {
                  const stepNum = i + 1;
                  const isActive = step === stepNum;
                  const isCompleted = step > stepNum;
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-purple-600 text-white'
                            : isActive
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                        }`}
                      >
                        {isCompleted ? <BsCheckCircle className="w-3.5 h-3.5" /> : stepNum}
                      </div>
                      <span
                        className={`text-xs hidden sm:inline ${
                          isActive ? 'text-purple-400 font-medium' : 'text-gray-500'
                        }`}
                      >
                        {label}
                      </span>
                      {i < 2 && (
                        <div
                          className={`flex-1 h-px mx-2 ${
                            isCompleted ? 'bg-purple-600' : 'bg-gray-700'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {/* Step 1: Select Employee */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BsPerson className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Select Employee</h3>
                  </div>
                  {loadingEmployees ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedEmployeeData && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {selectedEmployeeData.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{selectedEmployeeData.name}</p>
                          <p className="text-xs text-gray-400">{selectedEmployeeData.email}</p>
                          {selectedEmployeeData.department && (
                            <p className="text-xs text-gray-500">{selectedEmployeeData.department}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Select Type */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BsListCheck className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Select Review Type</h3>
                  </div>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedType === 'THREE_MONTH'
                          ? 'bg-purple-500/15 border-purple-500/40'
                          : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reviewType"
                        value="THREE_MONTH"
                        checked={selectedType === 'THREE_MONTH'}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-4 h-4 accent-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <BsCalendar3 className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">3-Month Review</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Quarterly performance check-in and feedback cycle
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedType === 'ANNUAL'
                          ? 'bg-purple-500/15 border-purple-500/40'
                          : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reviewType"
                        value="ANNUAL"
                        checked={selectedType === 'ANNUAL'}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-4 h-4 accent-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <BsCalendarCheck className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">Annual Review</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Comprehensive yearly performance evaluation
                        </p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Select Reviewers */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BsPeople className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-white">Select Reviewers</h3>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        selectedReviewers.length >= 3
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {selectedReviewers.length} selected (min 3)
                    </span>
                  </div>

                  {/* Reviewer search */}
                  <input
                    type="text"
                    placeholder="Search reviewers..."
                    value={reviewerSearch}
                    onChange={(e) => setReviewerSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                  />

                  {loadingReviewers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {filteredReviewers.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No reviewers available</p>
                      ) : (
                        filteredReviewers.map((reviewer) => {
                          const isSelected = selectedReviewers.includes(reviewer.id);
                          return (
                            <div
                              key={reviewer.id}
                              onClick={() => toggleReviewer(reviewer.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-500/15 border-purple-500/40'
                                  : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600/50'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-600'
                                    : 'border-gray-600 bg-gray-800'
                                }`}
                              >
                                {isSelected && <BsCheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{reviewer.name}</p>
                                <p className="text-xs text-gray-400 truncate">{reviewer.email}</p>
                              </div>
                              {reviewer.department && (
                                <span className="text-xs text-gray-500 flex-shrink-0">{reviewer.department}</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-700/50">
              <button
                onClick={step > 1 ? () => setStep(step - 1) : onClose}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <BsArrowLeft className="w-3.5 h-3.5" />
                {step > 1 ? 'Back' : 'Cancel'}
              </button>
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <BsArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <BsCheckCircle className="w-3.5 h-3.5" />
                      Initiate Review
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
