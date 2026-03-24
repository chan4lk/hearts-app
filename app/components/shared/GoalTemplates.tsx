import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsStars, BsBriefcase, BsCode, BsBug, BsPeople, BsBarChart } from 'react-icons/bs';
import { GOAL_TEMPLATES } from './constants';

type IconType = typeof BsRocket | typeof BsLightbulb | typeof BsAward | typeof BsGraphUp | typeof BsStars | typeof BsBriefcase | typeof BsCode | typeof BsBug | typeof BsPeople | typeof BsBarChart;

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
  'BsBriefcase': BsBriefcase,
  'BsCode': BsCode,
  'BsBug': BsBug,
  'BsPeople': BsPeople,
  'BsBarChart': BsBarChart
};

export default function GoalTemplates({ onSelect }: GoalTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = selectedCategory === 'all'
    ? GOAL_TEMPLATES
    : GOAL_TEMPLATES.filter(template => template.category === selectedCategory);

  const categories = Array.from(new Set(GOAL_TEMPLATES.map(t => t.category)));

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="flex flex-wrap gap-2 p-1 bg-surface-secondary backdrop-blur-xl rounded-2xl border border-white/10">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
            ${selectedCategory === 'all' 
              ? 'text-[rgb(var(--color-text-inverse))] bg-gradient-to-r from-[rgb(var(--color-info))]/90 to-[rgb(var(--color-cat-technical))]/90 shadow-[rgba(var(--color-cat-technical),0.2)]' 
              : 'text-secondary hover:text-[rgb(var(--color-text-inverse))] hover:bg-surface-tertiary'}`}
        >
          <span className="relative z-10">All Templates</span>
          {selectedCategory === 'all' && (
            <motion.div
              layoutId="activeCategory"
              className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-info))]/20 to-[rgb(var(--color-cat-technical))]/20 rounded-xl blur-xl"
            />
          )}
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
              ${selectedCategory === category 
                ? 'text-[rgb(var(--color-text-inverse))] bg-gradient-to-r from-[rgb(var(--color-info))]/90 to-[rgb(var(--color-cat-technical))]/90 shadow-[rgba(var(--color-cat-technical),0.2)]' 
                : 'text-secondary hover:text-[rgb(var(--color-text-inverse))] hover:bg-surface-tertiary'}`}
          >
            <span className="relative z-10">{category}</span>
            {selectedCategory === category && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-info))]/20 to-[rgb(var(--color-cat-technical))]/20 rounded-xl blur-xl"
              />
            )}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = iconMap[template.icon];
          if (!Icon) {
            return null;
          }
          return (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template)}
              className="group relative overflow-hidden"
            >
              <div className={`relative p-6 rounded-2xl backdrop-blur-xl border border-white/10 transition-all duration-300
                ${template.bgColor} ${template.bgGradient} hover:shadow-theme-lg hover:shadow-[rgba(var(--color-cat-technical),0.1)]`}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-surface-secondary rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${template.iconColor} bg-opacity-20 backdrop-blur-xl
                      ring-1 ring-white/20 transform transition-transform duration-300
                      group-hover:scale-110 group-hover:rotate-[10deg]`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[rgb(var(--color-text-inverse))] group-hover:text-transparent 
                        group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[rgb(var(--color-info))] group-hover:to-[rgb(var(--color-cat-technical))]
                        transition-all duration-300">{template.title}</h3>
                      <p className="text-sm text-secondary/90">{template.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-secondary/80 text-sm leading-relaxed">{template.description}</p>
                </div>

                {/* Hover Effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  bg-gradient-to-t from-[rgba(var(--color-cat-technical),0.3)] via-transparent to-transparent" />
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