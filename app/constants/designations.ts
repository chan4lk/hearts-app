/**
 * Predefined Designations
 * This file contains all available designations for employees.
 * To add a new designation, simply add it to the array below.
 */

export const DESIGNATIONS = [
  'Senior Software Engineer',
  'Software Engineer',
  'QA Lead',
  'Tech Lead',
  'Senior Tech Lead',
  'Associate Tech Lead',
  'Accountant',
  'Senior Accountant',
  'Consultant - Senior',
  'Manager - IT Security',
  'Security Manager - GCN',
  'Security Engineer',
  'Project Manager',
  'Graphic Designer',
  'Learning and Development Coordinator',
  'Operations Executive',
  'Senior Finance Executive',
  'Administrative Assistant',
  'Talent Acquisition Specialist',
  'Business Analyst',
  'Lead - Client Operations',
  'Associate QA Engineer',
  'Finance Executive',
  'BTG Consultant - Security Engineer',
  'System Engineer',
  'BTG Consultant - Junior Process Analyst',
  'Associate Software Engineer',
  'BTG Consultant - Accounting Practice Lead',
  'Senior Power Platform Developer',
  'BTG Consultant - Tech Lead',
  'Sales Executive',
  'Senior Medical Marketing Executive',
  'Customer Success Officer',
  'Senior Quality Assurance Engineer',
  'Senior QA Engineer',
  'BTG Consultant - SharePoint',
  'Consultant - Tech Lead',
  'BTG Consultant - PM Trainee',
  'Associate BI Engineer',
  'Practice Lead',
  'Accounts Executive',
  'Associate Project Manager',
  'Senior Digital Marketing Executive',
  'People & Culture Executive',
  'Technical Security Specialist - Information Assurance',
  'UI Lead',
  'Finance Trainee',
  'Senior Data Engineer',
  'Senior Draughtsman',
  'BTG Consultant',
  'Senior Network Engineer',
  'Event Management Executive'
] as const;

export type Designation = typeof DESIGNATIONS[number];

/**
 * Get all designations as a sorted array
 */
export function getDesignations(): string[] {
  return [...DESIGNATIONS].sort();
}

/**
 * Search designations by keyword
 */
export function searchDesignations(keyword: string): string[] {
  if (!keyword.trim()) {
    return getDesignations();
  }
  const lowerKeyword = keyword.toLowerCase();
  return DESIGNATIONS.filter(designation =>
    designation.toLowerCase().includes(lowerKeyword)
  ).sort();
}

