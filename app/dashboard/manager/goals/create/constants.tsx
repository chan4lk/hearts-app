import React from 'react';
import { BsBriefcase, BsLightningCharge, BsGraphUp, BsBook, BsHeart } from 'react-icons/bs';
import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    value: 'PROFESSIONAL',
    label: 'Professional Development',
    icon: BsBriefcase
  },
  {
    value: 'PERFORMANCE',
    label: 'Performance',
    icon: BsLightningCharge
  },
  {
    value: 'GROWTH',
    label: 'Growth',
    icon: BsGraphUp
  },
  {
    value: 'LEARNING',
    label: 'Learning',
    icon: BsBook
  },
  {
    value: 'WELLBEING',
    label: 'Wellbeing',
    icon: BsHeart
  }
]; 