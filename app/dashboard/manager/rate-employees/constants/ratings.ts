export const RATING_LABELS = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding"
} as const;

export const RATING_DESCRIPTIONS = {
  1: "Performance consistently falls below expected standards. Significant improvement needed in key areas.",
  2: "Performance occasionally meets standards but improvement is needed to fully meet expectations.",
  3: "Performance consistently meets job requirements and expectations. Demonstrates solid competence.",
  4: "Performance frequently exceeds job requirements. Demonstrates strong skills and initiative.",
  5: "Performance consistently exceeds all expectations. Demonstrates exceptional achievements."
} as const;

// Modern, vibrant colors with gradients
export const RATING_COLORS = {
  1: "bg-gradient-to-r from-rose-500/10 to-red-500/10 text-rose-500 border-rose-500/20",
  2: "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-500 border-orange-500/20",
  3: "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 border-yellow-500/20",
  4: "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-500 border-emerald-500/20",
  5: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-500 border-blue-500/20"
} as const;

export const RATING_HOVER_COLORS = {
  1: "hover:bg-gradient-to-r hover:from-rose-500 hover:to-red-500 hover:text-white",
  2: "hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 hover:text-white",
  3: "hover:bg-gradient-to-r hover:from-yellow-500 hover:to-amber-500 hover:text-white",
  4: "hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-500 hover:text-white",
  5: "hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white"
} as const; 