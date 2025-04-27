'use client';

import { GOAL_TEMPLATES } from './constants';
import { BsLightbulb } from 'react-icons/bs';

interface GoalTemplatesProps {
  onTemplateSelect: (template: typeof GOAL_TEMPLATES[0]) => void;
}

export function GoalTemplates({ onTemplateSelect }: GoalTemplatesProps) {
  return (
    <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500/10 p-2 rounded-lg">
          <BsLightbulb className="w-5 h-5 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Goal Templates</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GOAL_TEMPLATES.map((template) => (
          <div
            key={template.id}
            onClick={() => onTemplateSelect(template)}
            className={`${template.bgColor} hover:bg-opacity-80 border border-gray-800 hover:border-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[#1E2028] border border-gray-700">
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{template.title}</h3>
                <p className="text-sm text-gray-400">{template.subtitle}</p>
                <p className="text-xs text-gray-500 mt-2">{template.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 