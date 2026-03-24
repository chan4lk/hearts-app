'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from './types';

interface GoalTemplate {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  estimatedDuration: string;
  icon: string;
}

interface BulkGoalTemplatesProps {
  assignedEmployees: User[];
  onApplyTemplate: (template: GoalTemplate, selectedEmployees: string[]) => void;
}

const goalTemplates: GoalTemplate[] = [
  {
    id: 'quarterly-review',
    name: 'Quarterly Performance Review',
    category: 'PROFESSIONAL',
    priority: 'HIGH',
    description: 'Complete quarterly performance review and set goals for next quarter',
    estimatedDuration: '30 days',
    icon: '📊'
  },
  {
    id: 'skill-development',
    name: 'Skill Development',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    description: 'Develop new technical skills relevant to current role',
    estimatedDuration: '60 days',
    icon: '🚀'
  },
  {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    category: 'LEADERSHIP',
    priority: 'MEDIUM',
    description: 'Improve team collaboration and communication skills',
    estimatedDuration: '45 days',
    icon: '🤝'
  },
  {
    id: 'project-completion',
    name: 'Project Completion',
    category: 'KPI',
    priority: 'HIGH',
    description: 'Complete assigned project within deadline and quality standards',
    estimatedDuration: '90 days',
    icon: '🎯'
  },
  {
    id: 'training-certification',
    name: 'Training & Certification',
    category: 'TRAINING',
    priority: 'MEDIUM',
    description: 'Complete required training and obtain relevant certification',
    estimatedDuration: '60 days',
    icon: '🎓'
  },
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction',
    category: 'KPI',
    priority: 'HIGH',
    description: 'Improve customer satisfaction scores and feedback',
    estimatedDuration: '90 days',
    icon: '😊'
  }
];

export function BulkGoalTemplates({ assignedEmployees, onApplyTemplate }: BulkGoalTemplatesProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === assignedEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(assignedEmployees.map(emp => emp.id));
    }
  };

  const handleApplyTemplate = (template: GoalTemplate) => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }
    onApplyTemplate(template, selectedEmployees);
    setSelectedEmployees([]);
    setSelectedTemplate(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'LOW': return 'text-green-600 bg-success-muted dark:bg-cat-training/30';
      default: return 'text-secondary bg-surface-secondary dark:bg-surface-primary/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PROFESSIONAL': return 'text-blue-600 bg-info-muted dark:bg-cat-professional/30';
      case 'TECHNICAL': return 'text-purple-600 bg-cat-technical dark:bg-cat-technical/30';
      case 'LEADERSHIP': return 'text-indigo-600 bg-indigo-100 dark:bg-accent-muted/30';
      case 'TRAINING': return 'text-green-600 bg-success-muted dark:bg-cat-training/30';
      case 'KPI': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      default: return 'text-secondary bg-surface-secondary dark:bg-surface-primary/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Employee Selection */}
      <div className="bg-gray-50 dark:bg-surface-tertiary rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-primary">
            Select Employees ({selectedEmployees.length}/{assignedEmployees.length})
          </h3>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-info dark:hover:text-cat-professional font-medium"
          >
            {selectedEmployees.length === assignedEmployees.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {assignedEmployees.map(employee => (
            <label
              key={employee.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-tertiary cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedEmployees.includes(employee.id)}
                onChange={() => handleEmployeeToggle(employee.id)}
                className="rounded border-gray-300 text-blue-600 focus-ring"
              />
              <span className="text-sm text-gray-700 dark:text-secondary truncate">
                {employee.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Goal Templates */}
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">
          Goal Templates
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalTemplates.map(template => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              className="bg-surface-elevated rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{template.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-primary mb-1 truncate">
                    {template.name}
                  </h4>
                  <p className="text-sm text-secondary dark:text-secondary mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}>
                      {template.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-tertiary dark:text-secondary">
                      ⏱️ {template.estimatedDuration}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(template);
                      }}
                      disabled={selectedEmployees.length === 0}
                      className="px-3 py-1 bg-blue-600 text-[rgb(var(--color-text-inverse))] text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply to {selectedEmployees.length} employee(s)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-primary mb-3">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => {
              if (selectedEmployees.length === 0) {
                alert('Please select employees first');
                return;
              }
              onApplyTemplate({
                id: 'weekly-checkin',
                name: 'Weekly Check-in',
                category: 'PROFESSIONAL',
                priority: 'MEDIUM',
                description: 'Schedule weekly one-on-one check-in meetings',
                estimatedDuration: '7 days',
                icon: '📅'
              }, selectedEmployees);
            }}
            disabled={selectedEmployees.length === 0}
            className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">📅</span>
            <span className="text-sm font-medium text-gray-700 dark:text-secondary">Weekly Check-in</span>
          </button>
          
          <button
            onClick={() => {
              if (selectedEmployees.length === 0) {
                alert('Please select employees first');
                return;
              }
              onApplyTemplate({
                id: 'monthly-review',
                name: 'Monthly Review',
                category: 'PROFESSIONAL',
                priority: 'HIGH',
                description: 'Conduct monthly performance review and feedback session',
                estimatedDuration: '30 days',
                icon: '📋'
              }, selectedEmployees);
            }}
            disabled={selectedEmployees.length === 0}
            className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">📋</span>
            <span className="text-sm font-medium text-gray-700 dark:text-secondary">Monthly Review</span>
          </button>
          
          <button
            onClick={() => {
              if (selectedEmployees.length === 0) {
                alert('Please select employees first');
                return;
              }
              onApplyTemplate({
                id: 'skill-assessment',
                name: 'Skill Assessment',
                category: 'TECHNICAL',
                priority: 'MEDIUM',
                description: 'Complete comprehensive skill assessment and development plan',
                estimatedDuration: '14 days',
                icon: '🔍'
              }, selectedEmployees);
            }}
            disabled={selectedEmployees.length === 0}
            className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">🔍</span>
            <span className="text-sm font-medium text-gray-700 dark:text-secondary">Skill Assessment</span>
          </button>
          
          <button
            onClick={() => {
              if (selectedEmployees.length === 0) {
                alert('Please select employees first');
                return;
              }
              onApplyTemplate({
                id: 'goal-setting',
                name: 'Goal Setting Session',
                category: 'PROFESSIONAL',
                priority: 'HIGH',
                description: 'Collaborative goal setting session for next quarter',
                estimatedDuration: '7 days',
                icon: '🎯'
              }, selectedEmployees);
            }}
            disabled={selectedEmployees.length === 0}
            className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">🎯</span>
            <span className="text-sm font-medium text-gray-700 dark:text-secondary">Goal Setting</span>
          </button>
        </div>
      </div>
    </div>
  );
}
