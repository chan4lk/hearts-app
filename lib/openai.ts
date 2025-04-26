import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GoalSuggestion {
  title: string;
  description: string;
}

interface OpenAIResponse {
  goals: GoalSuggestion[];
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

    const completion = await openai.chat.completions.create({
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

    const completion = await openai.chat.completions.create({
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