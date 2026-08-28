// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAIClient } from '../_shared/ai-provider/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'generate-topics' | 'generate-skills' | 'generate-plan';
  interest?: {
    category: string;
    freeText?: string;
  };
  topic?: {
    id: string;
    title: string;
    description: string;
  };
  skills?: Array<{
    id: string;
    name: string;
    level: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, interest, topic, skills } = await req.json() as RequestBody;

    const aiClient = createAIClient();

    let prompt = '';
    let systemPrompt = 'You are an expert learning advisor who creates personalized learning journeys. Respond with valid JSON only.';

    switch (action) {
      case 'generate-topics':
        systemPrompt += ' Generate 30-40 diverse, specific learning topics. Just topic names, nothing else. Respond with valid JSON.';
        prompt = `Based on this interest: ${interest?.category}${interest?.freeText ? ` - "${interest.freeText}"` : ''}, generate 30-40 specific, diverse learning topics.

Make them concrete and actionable. Mix broad and narrow topics. No descriptions, just names.

Return ONLY this JSON structure:
{
  "topics": ["Topic name 1", "Topic name 2", "Topic name 3", ... 30-40 total]
}`;
        break;

      case 'generate-skills':
        systemPrompt += ' Generate 30-40 subtopics based on the parent topic. Just names. Respond with valid JSON.';
        prompt = `For the topic "${topic?.title}", generate 30-40 related subtopics someone could dive deeper into.

Make them specific and diverse. Mix different angles, applications, and specializations.

Return ONLY this JSON structure:
{
  "skills": ["Subtopic 1", "Subtopic 2", "Subtopic 3", ... 30-40 total]
}`;
        break;

      case 'generate-plan': {
  systemPrompt += ' Create a detailed, actionable learning plan.';
  const skillsList = skills?.map(s => `${s.name} (${s.level})`).join(', ');
  // Prompt to generate the learning plan JSON
  prompt = `Create a personalized learning plan for someone learning "${topic?.title}" with these selected skills: ${skillsList}\n\nReturn a JSON object with this structure:\n{\n  "title": "Personalized plan title",\n  "description": "Overview of what they'll achieve",\n  "totalDuration": "e.g., 12 weeks",\n  "weeklyCommitment": "e.g., 10-15 hours",\n  "milestones": [\n    {\n      "week": 1,\n      "title": "Milestone title",\n      "description": "What they'll accomplish",\n      "tasks": ["Task 1", "Task 2", "Task 3"]\n    }\n  ],\n  "firstProject": {\n    "title": "Project name",\n    "description": "What they'll build",\n    "skills": ["Skill 1", "Skill 2"],\n    "estimatedTime": "e.g., 8 hours"\n  },\n  "resources": [\n    {\n      "type": "video|article|course|documentation",\n      "title": "Resource title",\n      "duration": "e.g., 2 hours",\n      "free": true\n    }\n  ],\n  "nextSteps": ["Step 1", "Step 2", "Step 3"]\n}`;
  // First AI call – generate the plan
  const planResponse = await aiClient.chat({
    functionType: 'content-generation',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    maxTokens: 3000,
    temperature: 0.7,
    responseFormat: 'json_object'
  });

  let planObj: any;
  try {
    if (!planResponse.content) throw new Error('Empty response from AI');
    const parsed = JSON.parse(planResponse.content);
    // The API may wrap the plan inside a `plan` key or return it directly
    planObj = parsed.plan ? parsed.plan : parsed;
  } catch (parseError) {
    console.error('Failed to parse learning plan:', planResponse.content);
    throw new Error('Invalid learning plan format from AI');
  }

  // -------------------------------------------------
  // SECOND CALL – generate reasoning for each task
  // -------------------------------------------------
  const flatTasks: string[] = (planObj.milestones ?? []).flatMap((m: any) => m.tasks ?? []);
  let reasonings: string[] = [];
  if (flatTasks.length) {
    const reasoningPrompt = `You are an expert learning advisor. For each of the following learning tasks, provide a concise explanation (1‑2 sentences) of why this specific task is recommended for the learner given their goal and current skills. Return a JSON object with a single field "reasonings" that is an array matching the order of the tasks.\n\nTasks:\n${flatTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    try {
      const reasoningResponse = await aiClient.chat({
        functionType: 'content-generation',
        messages: [
          { role: 'system', content: 'Provide reasoning for each learning task.' },
          { role: 'user', content: reasoningPrompt }
        ],
        maxTokens: 2000,
        temperature: 0.7,
        responseFormat: 'json_object'
      });
      const parsed = JSON.parse(reasoningResponse.content ?? '{}');
      reasonings = Array.isArray(parsed.reasonings) ? parsed.reasonings : [];
    } catch (e) {
      console.error('Reasoning generation failed:', e);
    }
  }

  // Attach reasoning to each milestone task (preserve original ordering)
  if (reasonings.length) {
    let idx = 0;
    for (const milestone of planObj.milestones ?? []) {
      if (Array.isArray(milestone.tasks)) {
        milestone.tasks = milestone.tasks.map((task: string) => {
          const reasoning = reasonings[idx++] || '';
          return { title: task, reasoning };
        });
      }
    }
  }

  const normalized = { plan: planObj };
  return new Response(JSON.stringify(normalized), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

      default:
        throw new Error('Invalid action');
    }

    const response = await aiClient.chat({
      functionType: 'content-generation',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      maxTokens: 2000,
      temperature: 0.7,
      responseFormat: 'json_object'
    });

    let result;
    try {
      // Parse the JSON response
      if (!response.content) {
        throw new Error('Empty response from AI');
      }
      result = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      throw new Error('Invalid response format from AI');
    }

    // Normalize result shape for each action to ensure consistent responses
    try {
      let normalized: any;
      if (action === 'generate-topics') {
        const topics: any = (result && Array.isArray(result.topics)) ? result.topics : Array.isArray(result) ? result : [];

        if (!Array.isArray(topics) || topics.some((t: any) => typeof t !== 'string')) {
          throw new Error('Invalid topics format');
        }

        normalized = { topics };
      } else if (action === 'generate-skills') {
        const skillsArr: any = (result && Array.isArray(result.skills)) ? result.skills : Array.isArray(result) ? result : [];
        if (!Array.isArray(skillsArr) || skillsArr.some((s: any) => typeof s !== 'string')) {
          throw new Error('Invalid skills format');
        }
        normalized = { skills: skillsArr };
      } else if (action === 'generate-plan') {
        // Accept a very small plan and forward as-is
        const plan = (result && result.plan) ? result.plan : result;
        if (!plan || typeof plan !== 'object') {
          throw new Error('Invalid plan format');
        }
        normalized = { plan };
      }

      return new Response(
        JSON.stringify(normalized),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (normalizationError) {
      console.error('Normalization error:', normalizationError);
      return new Response(
        JSON.stringify({ error: normalizationError.message || 'Response normalization failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in generate-learning-journey:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});