
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/learning/LearningStep";
import { startBackgroundContentGeneration } from "./backgroundContentGeneration";
import { triggerMentalModelGeneration } from "@/utils/triggerMentalModelGeneration";

// Generate a learning plan for a given topic
export const generateLearningPlan = async (topic: string): Promise<Step[]> => {
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User is not authenticated");
  }
  
  // Check if a learning path already exists for this topic for the current user
  let existingPaths: any[] | null = null;
  try {
    const { data } = await supabase
      .from('learning_paths')
      .select('id, topic, is_approved')
      .eq('topic', topic)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    existingPaths = data;
  } catch (err) {
    console.warn("Could not query existing paths:", err);
  }
  
  let pathId: string = `path-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // If a path already exists, use it, otherwise create a new one
  if (existingPaths && existingPaths.length > 0) {
    pathId = existingPaths[0].id;
    console.log("Found existing learning path:", pathId);
    
    // Check if the path already has steps
    let existingSteps: any[] | null = null;
    try {
      const { data } = await supabase
        .from('learning_steps')
        .select('id, title, content, order_index')
        .eq('path_id', pathId)
        .order('order_index');
      existingSteps = data;
    } catch (err) {
      console.warn("Could not query existing steps:", err);
    }
      
    // If steps exist, return them
    if (existingSteps && existingSteps.length > 0) {
      console.log(`Found ${existingSteps.length} existing steps for path ${pathId}`);
      
      // Start background generation for steps without detailed content
      startBackgroundContentGeneration(existingSteps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.content || ""
      })), topic, pathId);
      
      return existingSteps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.content || ""
      }));
    }
  } else {
    // Get content preferences from session storage
    let contentPreferences: Record<string, any> = {};
    try {
      const storedPrefs = sessionStorage.getItem('content-preferences');
      if (storedPrefs) {
        contentPreferences = JSON.parse(storedPrefs);
      }
    } catch (e) {
      console.log('No content preferences found or error parsing:', e);
    }

    // Filter to only include valid learning_paths columns
    const validPreferences: Record<string, any> = {};
    const validKeys = ['content_style', 'content_length', 'content_complexity', 'preferred_examples', 'learning_approach'];
    for (const key of validKeys) {
      if (contentPreferences[key] !== undefined && contentPreferences[key] !== null) {
        validPreferences[key] = contentPreferences[key];
      }
    }

    // Create a new learning path with preferences
    console.log("Creating new learning path for topic:", topic);
    
    try {
      const insertData: Record<string, any> = {
        topic,
        user_id: user.id,
        is_approved: false,
        ...validPreferences
      };
      
      const { data, error } = await supabase
        .from('learning_paths')
        .insert(insertData)
        .select();
      
      if (!error && data && data.length > 0) {
        pathId = data[0].id;
        console.log("New learning path created in database:", pathId);
      } else if (error && error.message?.includes('column') && error.message?.includes('schema cache')) {
        const { data: basicData } = await supabase
          .from('learning_paths')
          .insert({
            topic,
            user_id: user.id,
            is_approved: false
          })
          .select();
        
        if (basicData && basicData.length > 0) {
          pathId = basicData[0].id;
        }
      }
    } catch (createErr) {
      console.warn("Could not insert new learning path into database, using fallback pathId:", createErr);
    }
    
    // Clear preferences from session storage after use
    sessionStorage.removeItem('content-preferences');
  }

  sessionStorage.setItem('learning-path-id', pathId);
  
  // Now generate the learning plan steps using AI
  let planSteps: Array<{ title: string; description: string }> = [];

  try {
    console.log("Calling edge function to generate learning plan");
    
    // Call the edge function to generate a learning plan with user context
    const response = await supabase.functions.invoke('generate-learning-content', {
      body: {
        topic,
        generatePlan: true,
        userId: user.id,
        pathId: pathId
      }
    });

    if (response.data && response.data.steps && Array.isArray(response.data.steps) && response.data.steps.length > 0) {
      planSteps = response.data.steps;
    }
  } catch (err) {
    console.warn("Edge function invocation failed or unavailable:", err);
  }

  // If no steps returned by edge function, use default structured curriculum fallback
  if (planSteps.length === 0) {
    console.log("Using fallback learning curriculum for topic:", topic);
    planSteps = [
      { title: `Foundations of ${topic}`, description: `Learn the fundamentals, environment setup, and core syntax of ${topic}.` },
      { title: `Core Workflows & Concepts in ${topic}`, description: `Master essential structures, functions, and key operations in ${topic}.` },
      { title: `Practical Implementation & Building`, description: `Build practical scripts and modules to solve real-world problems.` },
      { title: `Advanced Techniques & Optimization`, description: `Implement error handling, performance tuning, and integration patterns.` },
      { title: `Capstone Project & Best Practices`, description: `Design, test, and publish a production-ready ${topic} project.` }
    ];
  }

  console.log(`Processing ${planSteps.length} steps for learning plan`);
  
  const steps: Step[] = [];
  
  for (let i = 0; i < planSteps.length; i++) {
    const step = planSteps[i];
    
    if (!step.title || !step.description) {
      continue;
    }
    
    let createdStepId = `step-${i}-${Date.now()}`;
    let createdContent = step.description;

    try {
      const { data: stepData, error: stepError } = await supabase
        .from('learning_steps')
        .insert({
          title: step.title,
          content: step.description,
          path_id: pathId,
          order_index: i,
          completed: false
        })
        .select();
        
      if (!stepError && stepData && stepData.length > 0) {
        createdStepId = stepData[0].id;
        createdContent = stepData[0].content || step.description;
      }
    } catch (dbErr) {
      console.warn(`Database step insert warning for step ${i}:`, dbErr);
    }
    
    steps.push({
      id: createdStepId,
      title: step.title,
      description: createdContent
    });
  }

  console.log(`Successfully created ${steps.length} learning steps`);

  // Trigger mental model image generation in background
  triggerMentalModelGeneration(pathId, topic).catch(error => {
    console.error('Failed to trigger mental model generation:', error);
  });

  return steps;
};
