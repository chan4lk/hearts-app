import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsStars, BsBriefcase } from 'react-icons/bs';
import { GOAL_TEMPLATES } from './constants';

type IconType = typeof BsRocket | typeof BsLightbulb | typeof BsAward | typeof BsGraphUp | typeof BsStars | typeof BsBriefcase;

interface Template {
  id: string;
  title: string;
  category: string;
  icon: string;
  iconColor: string;
  description: string;
  subtitle: string;
  bgGradient: string;
  bgColor: string;
}

interface GoalTemplatesProps {
  onSelect: (template: Template) => void;
}

const iconMap: Record<string, IconType> = {
  'BsRocket': BsRocket,
  'BsLightbulb': BsLightbulb,
  'BsAward': BsAward,
  'BsGraphUp': BsGraphUp,
  'BsStars': BsStars,
  'BsBriefcase': BsBriefcase
};

export default function GoalTemplates({ onSelect }: GoalTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = selectedCategory === 'all'
    ? GOAL_TEMPLATES
    : GOAL_TEMPLATES.filter(template => template.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
            ${selectedCategory === 'all' 
              ? 'text-white bg-gradient-to-r from-blue-500/90 to-purple-500/90 shadow-lg shadow-purple-500/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <span className="relative z-10">All Templates</span>
          {selectedCategory === 'all' && (
            <motion.div
              layoutId="activeCategory"
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl"
            />
          )}
        </button>
        {Array.from(new Set(GOAL_TEMPLATES.map(t => t.category))).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
              ${selectedCategory === category 
                ? 'text-white bg-gradient-to-r from-blue-500/90 to-purple-500/90 shadow-lg shadow-purple-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <span className="relative z-10">{category}</span>
            {selectedCategory === category && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl"
              />
            )}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = iconMap[template.icon];
          return (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template)}
              className="group relative overflow-hidden"
            >
              <div className={`relative p-6 rounded-2xl backdrop-blur-xl border border-white/10 transition-all duration-300
                ${template.bgColor} ${template.bgGradient} hover:shadow-2xl hover:shadow-purple-500/10`}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${template.iconColor} bg-opacity-20 backdrop-blur-xl
                      ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                      group-hover:scale-110 group-hover:rotate-[10deg]`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-transparent 
                        group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                        transition-all duration-300">{template.title}</h3>
                      <p className="text-sm text-gray-300/90">{template.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-300/80 text-sm leading-relaxed">{template.description}</p>
                </div>

                {/* Hover Effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                  bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
} 