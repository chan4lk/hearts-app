import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BsListTask, BsCalendar, BsX, BsArrowCounterclockwise, BsRobot, BsLightning, BsBriefcase, BsLightningCharge, BsGraphUp, BsBook, BsHeart } from 'react-icons/bs';
import { AIGoalSuggestions } from '@/app/components/shared/AIGoalSuggestions';
import { motion, AnimatePresence } from 'framer-motion';

// Define categories that match the Prisma schema
const CATEGORIES = [
  {
    value: 'PROFESSIONAL',
    label: 'Professional Development',
    icon: BsBriefcase,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    value: 'TECHNICAL',
    label: 'Technical Skills',
    icon: BsLightningCharge,
    color: 'from-purple-500 to-pink-500'
  },
  {
    value: 'LEADERSHIP',
    label: 'Leadership',
    icon: BsGraphUp,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    value: 'PERSONAL',
    label: 'Personal Growth',
    icon: BsHeart,
    color: 'from-rose-500 to-red-500'
  },
  {
    value: 'TRAINING',
    label: 'Training',
    icon: BsBook,
    color: 'from-amber-500 to-orange-500'
  }
];

export interface SelfCreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: { title: string; description: string; dueDate: string; category: string }) => void;
  loading: boolean;
  goal: { title: string; description: string; dueDate: string; category: string };
  setGoal: (goal: { title: string; description: string; dueDate: string; category: string }) => void;
}

export function SelfCreateGoalModal({ isOpen, onClose, onSubmit, loading, goal, setGoal }: SelfCreateGoalModalProps) {
  const [context, setContext] = useState('');
  const selectedCategory = CATEGORIES.find(c => c.value === goal.category);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(goal);
  };

  const handleSuggestionSelect = (suggestion: { title: string; description: string }) => {
    setGoal({
      ...goal,
      title: suggestion.title,
      description: suggestion.description,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-[#0c0c0c]/90 backdrop-blur-xl rounded-2xl w-full max-w-md shadow-2xl border border-white/5 overflow-hidden"
          >
            {/* Header with dynamic gradient based on category */}
            <div className={`relative p-6 bg-gradient-to-br ${selectedCategory?.color || 'from-gray-800 to-gray-900'} transition-colors duration-500`}>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl shadow-xl">
                  {selectedCategory && <selectedCategory.icon className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Create Goal</h2>
                  <p className="text-sm text-white/70">Define your next achievement</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full backdrop-blur-md"
              >
                <BsX className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Title & Category Row */}
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-white transition-colors">Goal Title</label>
                  <Input
                    value={goal.title}
                    onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                    placeholder="Enter goal title"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm h-11 rounded-xl focus:border-white/20 focus:ring-white/10 transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                  <Select
                    value={goal.category}
                    onValueChange={(value) => setGoal({ ...goal, category: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-11 rounded-xl focus:border-white/20 focus:ring-white/10">
                      <SelectValue>{selectedCategory?.label || 'Select category'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c0c0c] border-white/10">
                      {CATEGORIES.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <SelectItem 
                            key={category.value} 
                            value={category.value} 
                            className="text-white text-sm focus:bg-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${category.color}`}>
                                <IconComponent className="h-3.5 w-3.5" />
                              </div>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date */}
              <div className="group">
                <label className="block text-sm font-medium text-white/70 mb-2">Due Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={goal.dueDate}
                    onChange={(e) => setGoal({ ...goal, dueDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-sm h-11 rounded-xl pl-11 focus:border-white/20 focus:ring-white/10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg bg-white/10">
                    <BsCalendar className="text-white/70 h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="group">
                <label className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                  <BsListTask className="h-4 w-4" /> Description
                </label>
                <Textarea
                  value={goal.description}
                  onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                  placeholder="Describe the goal details..."
                  className="bg-white/5 border-white/10 text-white text-sm min-h-[80px] rounded-xl focus:border-white/20 focus:ring-white/10 resize-none placeholder:text-white/30"
                />
              </div>

              {/* AI Context */}
              <div className="group">
                <label className="block text-sm font-medium text-blue-300/70 mb-2 flex items-center gap-2">
                  <BsRobot className="h-4 w-4" /> AI Context (Optional)
                </label>
                <Textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Additional context for AI suggestions..."
                  className="bg-blue-500/5 border-blue-500/10 text-white text-sm min-h-[60px] rounded-xl focus:border-blue-500/20 focus:ring-blue-500/10 resize-none placeholder:text-white/30"
                />
              </div>

              {/* AI Suggestions */}
              <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl p-4 border border-blue-500/10 backdrop-blur-sm">
                <AIGoalSuggestions
                  category={goal.category}
                  context={context}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setGoal({
                        title: '',
                        description: '',
                        dueDate: new Date().toISOString().split('T')[0],
                        category: 'PROFESSIONAL'
                      });
                      setContext('');
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white text-sm h-11 rounded-xl transition-all duration-200"
                  >
                    <BsArrowCounterclockwise className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-gradient-to-r ${selectedCategory?.color || 'from-blue-500 to-indigo-500'} 
                      hover:opacity-90 text-white text-sm h-11 rounded-xl font-medium transition-all duration-300 
                      shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <BsLightning className="h-4 w-4" />
                        Create Goal
                      </div>
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white text-sm h-11 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 