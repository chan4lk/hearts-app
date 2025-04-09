'use client';

import React from 'react';

export default function FeaturesButton() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToFeatures}
      className="px-8 py-4 rounded-xl border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-white transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
    >
      Features
    </button>
  );
} 