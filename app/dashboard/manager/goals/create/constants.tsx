import React from 'react';
import { BsBriefcase, BsLightningCharge, BsGraphUp, BsBook, BsHeart } from 'react-icons/bs';
import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    value: 'PROFESSIONAL',
    label: 'Professional Development',
    icon: <BsBriefcase className="h-4 w-4" />
  },
  {
    value: 'PERFORMANCE',
    label: 'Performance',
    icon: <BsLightningCharge className="h-4 w-4" />
  },
  {
    value: 'GROWTH',
    label: 'Growth',
    icon: <BsGraphUp className="h-4 w-4" />
  },
  {
    value: 'LEARNING',
    label: 'Learning',
    icon: <BsBook className="h-4 w-4" />
  },
  {
    value: 'WELLBEING',
    label: 'Wellbeing',
    icon: <BsHeart className="h-4 w-4" />
  }
]; 