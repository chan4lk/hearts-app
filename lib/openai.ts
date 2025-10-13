import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

interface GoalSuggestion {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  estimatedDuration?: string;
}

interface OpenAIResponse {
  goals: GoalSuggestion[];
}

interface PerformanceInsight {
  type: 'success' | 'warning' | 'risk' | 'opportunity';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface GoalRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  completionProbability: number;
  risks: string[];
  recommendations: string[];
}

export async function generateGoalSuggestions(
  category: string,
  employeeRole: string,
  context?: string
): Promise<GoalSuggestion[]> {
  try {
    const prompt = `Generate 3 professional goals for a ${employeeRole} in the ${category} category.
    ${context ? `Context: ${context}` : ''}
    Each goal should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).
    Return the goals in JSON format with title and description fields.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional goal-setting assistant. Generate SMART goals that are specific, measurable, achievable, relevant, and time-bound."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const response = JSON.parse(completion.choices[0].message.content) as OpenAIResponse;

    if (!response.goals || !Array.isArray(response.goals)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return response.goals;
  } catch (error) {
    console.error('Error generating goal suggestions:', error);
    throw new Error('Failed to generate goal suggestions');
  }
}

export async function enhanceGoalDescription(
  title: string,
  description: string,
  category: string
): Promise<string> {
  try {
    const prompt = `Enhance this goal description to make it more specific and measurable:
    Title: ${title}
    Category: ${category}
    Current Description: ${description}

    Make the description more detailed and actionable while maintaining its original intent.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional goal-writing assistant. Enhance goal descriptions to be more specific and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error enhancing goal description:', error);
    throw new Error('Failed to enhance goal description');
  }
}

// Advanced AI Functions for Phase 2

/**
 * Generate personalized goal recommendations based on user profile and performance history
 */
export async function generatePersonalizedGoals(
  userProfile: {
    role: string;
    department: string;
    position?: string;
    currentGoals?: number;
    completedGoals?: number;
    averageRating?: number;
  },
  count: number = 5
): Promise<GoalSuggestion[]> {
  try {
    const prompt = `Generate ${count} personalized SMART goals for an employee with the following profile:
    - Role: ${userProfile.role}
    - Department: ${userProfile.department}
    - Position: ${userProfile.position || 'Not specified'}
    - Current Active Goals: ${userProfile.currentGoals || 0}
    - Completed Goals: ${userProfile.completedGoals || 0}
    - Average Performance Rating: ${userProfile.averageRating || 'N/A'}/5

    Consider:
    1. Career progression and skill development
    2. Department-specific objectives
    3. Balance between technical and soft skills
    4. Realistic workload (current goals count)
    5. Past performance patterns

    Return JSON with array of goals, each having: title, description, category, priority, estimatedDuration`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert HR consultant and performance management specialist. Generate personalized, achievable goals that align with career development and organizational objectives."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const response = JSON.parse(completion.choices[0].message.content) as OpenAIResponse;
    return response.goals || [];
  } catch (error) {
    console.error('Error generating personalized goals:', error);
    throw new Error('Failed to generate personalized goals');
  }
}

/**
 * Analyze goal and predict completion probability with risk factors
 */
export async function analyzeGoalRisk(goal: {
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  category: string;
  employeeWorkload?: number;
}): Promise<GoalRiskAnalysis> {
  try {
    const daysUntilDue = Math.ceil((new Date(goal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const prompt = `Analyze this goal and assess completion risk:

    Goal: ${goal.title}
    Description: ${goal.description}
    Category: ${goal.category}
    Current Progress: ${goal.progress}%
    Days Until Due: ${daysUntilDue}
    Employee's Active Goals: ${goal.employeeWorkload || 'Unknown'}

    Provide:
    1. Risk level (low/medium/high)
    2. Completion probability (0-100%)
    3. List of specific risks
    4. Actionable recommendations

    Return JSON with: riskLevel, completionProbability, risks (array), recommendations (array)`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a project risk analyst specializing in performance management. Provide realistic, data-driven risk assessments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(completion.choices[0].message.content) as GoalRiskAnalysis;
  } catch (error) {
    console.error('Error analyzing goal risk:', error);
    throw new Error('Failed to analyze goal risk');
  }
}

/**
 * Generate performance insights from employee's goal history
 */
export async function generatePerformanceInsights(performanceData: {
  totalGoals: number;
  completedGoals: number;
  pendingGoals: number;
  averageRating: number;
  goalsByCategory: { [key: string]: number };
  recentTrend: 'improving' | 'declining' | 'stable';
}): Promise<PerformanceInsight[]> {
  try {
    const completionRate = performanceData.totalGoals > 0
      ? (performanceData.completedGoals / performanceData.totalGoals * 100).toFixed(1)
      : '0';

    const prompt = `Analyze this employee's performance data and generate actionable insights:

    Performance Metrics:
    - Total Goals: ${performanceData.totalGoals}
    - Completed: ${performanceData.completedGoals} (${completionRate}%)
    - Pending: ${performanceData.pendingGoals}
    - Average Rating: ${performanceData.averageRating}/5
    - Recent Trend: ${performanceData.recentTrend}
    - Goals by Category: ${JSON.stringify(performanceData.goalsByCategory)}

    Generate 3-5 insights covering:
    1. Strengths and achievements
    2. Areas for improvement
    3. Potential risks or concerns
    4. Growth opportunities

    Each insight should have: type (success/warning/risk/opportunity), title, description, recommendation, priority (high/medium/low)

    Return JSON with insights array.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a performance analytics expert. Provide constructive, actionable insights that help employees and managers improve performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const response = JSON.parse(completion.choices[0].message.content);
    return response.insights || [];
  } catch (error) {
    console.error('Error generating performance insights:', error);
    throw new Error('Failed to generate performance insights');
  }
}

/**
 * AI Writing Assistant - Improve feedback/comments
 */
export async function improveFeedback(
  originalText: string,
  context: {
    type: 'manager_comment' | 'self_rating' | 'goal_description';
    tone?: 'constructive' | 'encouraging' | 'professional';
  }
): Promise<string> {
  try {
    const toneGuidance = {
      constructive: 'constructive and balanced, highlighting both strengths and areas for improvement',
      encouraging: 'positive and motivating, focusing on growth and potential',
      professional: 'professional and objective, focusing on facts and outcomes'
    };

    const prompt = `Improve this ${context.type.replace('_', ' ')}:

Original: "${originalText}"

Make it more ${toneGuidance[context.tone || 'professional']}.
Ensure it's:
- Clear and specific
- Actionable
- Respectful and professional
- Focused on behaviors and outcomes, not personality

Return only the improved text, no explanations.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional communication coach specializing in workplace feedback. Help write clear, constructive, and professional feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error improving feedback:', error);
    throw new Error('Failed to improve feedback');
  }
}

/**
 * Generate automated performance review summary
 */
export async function generatePerformanceReview(employeeData: {
  name: string;
  role: string;
  period: string;
  goals: Array<{
    title: string;
    status: string;
    rating?: number;
    category: string;
  }>;
  strengths?: string[];
  improvements?: string[];
}): Promise<string> {
  try {
    const completedGoals = employeeData.goals.filter(g => g.status === 'COMPLETED').length;
    const avgRating = employeeData.goals
      .filter(g => g.rating)
      .reduce((sum, g) => sum + (g.rating || 0), 0) / employeeData.goals.length || 0;

    const prompt = `Generate a professional performance review summary for:

    Employee: ${employeeData.name}
    Role: ${employeeData.role}
    Review Period: ${employeeData.period}

    Performance Data:
    - Total Goals: ${employeeData.goals.length}
    - Completed: ${completedGoals}
    - Average Rating: ${avgRating.toFixed(1)}/5
    - Goals: ${JSON.stringify(employeeData.goals.map(g => ({ title: g.title, status: g.status, category: g.category })))}
    ${employeeData.strengths ? `- Strengths: ${employeeData.strengths.join(', ')}` : ''}
    ${employeeData.improvements ? `- Areas for Improvement: ${employeeData.improvements.join(', ')}` : ''}

    Create a comprehensive review with:
    1. Executive Summary
    2. Key Achievements
    3. Areas of Excellence
    4. Development Opportunities
    5. Recommendations for Next Period

    Use professional, balanced language. Be specific and constructive.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an experienced HR professional specializing in performance reviews. Write comprehensive, fair, and constructive performance reviews."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating performance review:', error);
    throw new Error('Failed to generate performance review');
  }
}

// Export types for use in other files
export type { GoalSuggestion, PerformanceInsight, GoalRiskAnalysis };