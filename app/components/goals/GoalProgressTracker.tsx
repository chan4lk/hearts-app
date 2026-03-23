'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BsCheckCircle,
  BsCircle,
  BsPlayCircle,
  BsPauseCircle,
  BsArrowRepeat,
  BsFlag
} from 'react-icons/bs';
import { Button } from '@/app/components/ui/button';

interface GoalProgressTrackerProps {
  goalId: string;
  currentProgress: number;
  currentStatus: string; // This is now progressStatus (NOT_STARTED, IN_PROGRESS, etc.)
  onProgressUpdate: (progress: number, progressStatus: string, notes?: string) => void;
  isEmployee: boolean;
}

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started', icon: BsCircle, color: 'gray' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: BsPlayCircle, color: 'blue' },
  { value: 'ON_HOLD', label: 'On Hold', icon: BsPauseCircle, color: 'amber' },
  { value: 'COMPLETED', label: 'Completed', icon: BsCheckCircle, color: 'green' },
  { value: 'BLOCKED', label: 'Blocked', icon: BsFlag, color: 'red' },
];

const PROGRESS_MILESTONES = [
  { value: 0, label: 'Not Started' },
  { value: 25, label: '25% Complete' },
  { value: 50, label: 'Halfway There' },
  { value: 75, label: 'Almost Done' },
  { value: 100, label: 'Completed' },
];

export default function GoalProgressTracker({
  goalId,
  currentProgress,
  currentStatus,
  onProgressUpdate,
  isEmployee
}: GoalProgressTrackerProps) {
  const [progress, setProgress] = useState(currentProgress);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const handleProgressChange = (value: number) => {
    setProgress(value);
    
    // Auto-update status based on progress
    if (value === 0) {
      setStatus('NOT_STARTED');
    } else if (value === 100) {
      setStatus('COMPLETED');
    } else if (value > 0 && status === 'NOT_STARTED') {
      setStatus('IN_PROGRESS');
    }
  };

  const handleQuickUpdate = async (newProgress: number) => {
    setProgress(newProgress);
    await handleSaveProgress(newProgress, status);
  };

  const handleSaveProgress = async (progressValue?: number, statusValue?: string) => {
    if (!isEmployee) {
      // Toast removed
      return;
    }

    setIsUpdating(true);
    try {
      const finalProgress = progressValue !== undefined ? progressValue : progress;
      const finalStatus = statusValue || status;

      // Call the parent's onProgressUpdate function
      await onProgressUpdate(finalProgress, finalStatus, notes);

      // Toast removed
      setShowNotes(false);
      setNotes('');
    } catch (error) { // handled silently
      // Error toast removed
    } finally {
      setIsUpdating(false);
    }
  };

  const getProgressColor = () => {
    if (progress === 0) return 'bg-gray-500';
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-amber-500';
    if (progress < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusColor = (statusValue: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === statusValue);
    return statusOption?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Progress Tracking</h3>
          <span className="text-2xl font-bold text-primary">{progress}%</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative">
          <div className="h-4 bg-[rgb(var(--color-border-primary))] rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getProgressColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          
          {/* Milestone Markers */}
          <div className="flex justify-between mt-2">
            {PROGRESS_MILESTONES.map((milestone) => (
              <div
                key={milestone.value}
                className="flex flex-col items-center"
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    progress >= milestone.value
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                  }`}
                />
                <span className="text-xs text-secondary mt-1">
                  {milestone.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Progress Buttons */}
      {isEmployee && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-secondary">Quick Update</label>
          <div className="grid grid-cols-5 gap-2">
            {PROGRESS_MILESTONES.map((milestone) => (
              <Button
                key={milestone.value}
                onClick={() => handleQuickUpdate(milestone.value)}
                disabled={isUpdating}
                variant={progress === milestone.value ? 'default' : 'outline'}
                className={`text-xs ${
                  progress === milestone.value
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-surface-secondary hover:bg-surface-tertiary'
                }`}
              >
                {milestone.value}%
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Progress Slider */}
      {isEmployee && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-secondary">
            Custom Progress: {progress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => handleProgressChange(parseInt(e.target.value))}
            className="w-full h-2 bg-[rgb(var(--color-border-primary))] rounded-lg appearance-none cursor-pointer accent-indigo-600"
            disabled={!isEmployee || isUpdating}
          />
        </div>
      )}

      {/* Status Selection */}
      {isEmployee && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-secondary">Status</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  disabled={isUpdating}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-500/20`
                      : 'border-theme bg-surface-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  <Icon className={`w-4 h-4 text-${option.color}-400`} />
                  <span className="text-sm text-primary">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Notes */}
      {isEmployee && (
        <div className="space-y-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            {showNotes ? '− Hide Notes' : '+ Add Progress Notes'}
          </button>
          
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What progress have you made? Any blockers?"
                className="w-full p-3 bg-surface-secondary border border-theme rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-indigo-500"
                rows={3}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* Save Button */}
      {isEmployee && (
        <Button
          onClick={() => handleSaveProgress()}
          disabled={isUpdating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isUpdating ? (
            <>
              <BsArrowRepeat className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <BsCheckCircle className="w-4 h-4 mr-2" />
              Save Progress
            </>
          )}
        </Button>
      )}

      {/* Read-only view for managers */}
      {!isEmployee && (
        <div className="bg-surface-secondary border border-theme rounded-lg p-4">
          <p className="text-sm text-secondary text-center">
            Only employees can update progress. You can view the current status above.
          </p>
        </div>
      )}
    </div>
  );
}

