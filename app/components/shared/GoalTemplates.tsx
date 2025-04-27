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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${selectedCategory === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All Templates
        </button>
        {Array.from(new Set(GOAL_TEMPLATES.map(t => t.category))).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedCategory === category 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = iconMap[template.icon];
          return (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template)}
              className={`p-6 rounded-xl text-left transition-all hover:shadow-lg
                ${template.bgColor} ${template.bgGradient}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${template.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{template.title}</h3>
                  <p className="text-sm text-gray-300">{template.subtitle}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{template.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
} 