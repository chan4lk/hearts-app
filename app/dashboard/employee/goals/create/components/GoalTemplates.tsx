import { motion } from 'framer-motion';
import { BsRocket, BsCode, BsTrophy, BsPerson, BsBook, BsArrowUpRight } from 'react-icons/bs';
import { GOAL_TEMPLATES } from '../constants';
import { NewGoal } from '../types';
import { useState } from 'react';

interface GoalTemplatesProps {
  onSelectTemplate: (goal: NewGoal) => void;
}

const CATEGORIES = [
  { 
    id: 'all', 
    label: 'All Templates', 
    icon: BsRocket,
    gradient: 'from-blue-400 to-purple-500',
    iconColor: 'text-blue-100',
    hoverGlow: 'group-hover:shadow-blue-500/50'
  },
  { 
    id: 'professional', 
    label: 'Professional', 
    icon: BsRocket,
    gradient: 'from-emerald-400 to-teal-500',
    iconColor: 'text-emerald-100',
    hoverGlow: 'group-hover:shadow-emerald-500/50'
  },
  { 
    id: 'technical', 
    label: 'Technical', 
    icon: BsCode,
    gradient: 'from-cyan-400 to-blue-500',
    iconColor: 'text-cyan-100',
    hoverGlow: 'group-hover:shadow-cyan-500/50'
  },
  { 
    id: 'leadership', 
    label: 'Leadership', 
    icon: BsTrophy,
    gradient: 'from-amber-400 to-orange-500',
    iconColor: 'text-amber-100',
    hoverGlow: 'group-hover:shadow-amber-500/50'
  },
  { 
    id: 'personal', 
    label: 'Personal', 
    icon: BsPerson,
    gradient: 'from-rose-400 to-pink-500',
    iconColor: 'text-rose-100',
    hoverGlow: 'group-hover:shadow-rose-500/50'
  },
  { 
    id: 'training', 
    label: 'Training', 
    icon: BsBook,
    gradient: 'from-violet-400 to-purple-500',
    iconColor: 'text-violet-100',
    hoverGlow: 'group-hover:shadow-violet-500/50'
  },
];

export const GoalTemplates = ({ onSelectTemplate }: GoalTemplatesProps) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = GOAL_TEMPLATES.filter(template => 
    activeCategory === 'all' || template.category.toLowerCase() === activeCategory
  );

  const getCategoryStyle = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || CATEGORIES[0];
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive 
                  ? `text-white bg-gradient-to-r ${category.gradient} shadow-lg` 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? category.iconColor : ''}`} />
                {category.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-20 rounded-xl blur-xl`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const categoryStyle = getCategoryStyle(template.category.toLowerCase());
          return (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelectTemplate({
                  title: template.title,
                  description: template.description,
                  category: template.category,
                  dueDate: new Date().toISOString().split('T')[0]
                });
              }}
              className="group relative overflow-hidden"
            >
              <div className={`relative p-6 rounded-2xl backdrop-blur-xl border border-white/10 transition-all duration-300
                bg-white/5 hover:shadow-2xl ${categoryStyle.hoverGlow}`}
              >
                {/* Decorative Elements */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryStyle.gradient} opacity-10 rounded-full blur-3xl transform translate-x-16 -translate-y-16`} />
                <div className={`absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr ${categoryStyle.gradient} opacity-10 rounded-full blur-3xl transform -translate-x-16 translate-y-16`} />
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryStyle.gradient} backdrop-blur-xl
                      ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                      group-hover:scale-110 group-hover:rotate-[10deg]`}>
                      <Icon className={`w-6 h-6 ${categoryStyle.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-transparent 
                        group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                        transition-all duration-300">{template.title}</h3>
                      <p className="text-sm text-gray-300/90">{template.category}</p>
                    </div>
                  </div>
                  <p className="text-gray-300/80 text-sm leading-relaxed">{template.description}</p>
                </div>

                {/* Hover Effects */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  bg-gradient-to-t ${categoryStyle.gradient} via-transparent to-transparent opacity-30`} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                  bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}; 