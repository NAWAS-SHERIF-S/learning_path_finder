// A complete mock implementation of the Supabase Client for offline/demo/localhost development.
// This intercepts all database and Edge Function calls and runs them locally in the browser
// using localStorage. If an 'openai_api_key' is found in localStorage, it will even use real
// OpenAI API calls for content generation!

import { Session, User } from '@supabase/supabase-js';

// Generates a mock UUID
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper to get/set localStorage items
const getStorageJson = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageJson = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed:', e);
  }
};

// Initial setup of mock DB tables in localStorage
const initMockDb = () => {
  if (!localStorage.getItem('mock_db_profiles')) {
    setStorageJson('mock_db_profiles', []);
  }
  if (!localStorage.getItem('mock_db_learning_paths')) {
    setStorageJson('mock_db_learning_paths', []);
  }
  if (!localStorage.getItem('mock_db_learning_steps')) {
    setStorageJson('mock_db_learning_steps', []);
  }
  if (!localStorage.getItem('mock_db_progress_tracking')) {
    setStorageJson('mock_db_progress_tracking', []);
  }
  if (!localStorage.getItem('mock_db_learning_sessions')) {
    setStorageJson('mock_db_learning_sessions', []);
  }
  if (!localStorage.getItem('mock_db_path_interactions')) {
    setStorageJson('mock_db_path_interactions', []);
  }
};

initMockDb();

// Main Mock Query Builder class mimicking Supabase JS select/insert/update/delete filters
class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private selectColumns: string = '*';
  private updateData: any = null;
  private insertData: any = null;
  private isDelete: boolean = false;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private orderColumn: string = '';
  private orderAsc: boolean = true;
  private limitCount: number = 0;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      if (item[column] === undefined) return false;
      return String(item[column]) === String(value);
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => String(item[column]) !== String(value));
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.map(String).includes(String(item[column])));
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderColumn = column;
    this.orderAsc = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    const allData = getStorageJson(`mock_db_${this.table}`, []);
    let filtered = [...allData];

    // Apply filters
    for (const filter of this.filters) {
      filtered = filtered.filter(filter);
    }

    // Apply ordering
    if (this.orderColumn) {
      filtered.sort((a, b) => {
        const valA = a[this.orderColumn];
        const valB = b[this.orderColumn];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (valA < valB) return this.orderAsc ? -1 : 1;
        if (valA > valB) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount > 0) {
      filtered = filtered.slice(0, this.limitCount);
    }

    if (this.isDelete) {
      const remaining = allData.filter((item: any) => !filtered.includes(item));
      setStorageJson(`mock_db_${this.table}`, remaining);
      return { data: filtered, error: null };
    }

    if (this.updateData) {
      const updatedList = allData.map((item: any) => {
        // If this item matches the filtered subset, update it
        const shouldUpdate = filtered.some(f => f.id === item.id);
        if (shouldUpdate) {
          return { ...item, ...this.updateData, updated_at: new Date().toISOString() };
        }
        return item;
      });
      setStorageJson(`mock_db_${this.table}`, updatedList);
      const updatedFiltered = filtered.map(f => ({ ...f, ...this.updateData }));
      return { data: this.isSingle ? updatedFiltered[0] : updatedFiltered, error: null };
    }

    if (this.insertData) {
      const newItems = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const sessionData = getStorageJson('learnflow_auth_session', null);
      const userId = sessionData?.session?.user?.id || 'demo-user-id';
      
      const newItemsWithMeta = newItems.map(item => ({
        id: uuid(),
        created_at: new Date().toISOString(),
        user_id: userId,
        ...item
      }));

      const updatedList = [...allData, ...newItemsWithMeta];
      setStorageJson(`mock_db_${this.table}`, updatedList);

      const result = Array.isArray(this.insertData) ? newItemsWithMeta : newItemsWithMeta[0];
      return { data: result, error: null };
    }

    if (this.isSingle) {
      if (filtered.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: filtered[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: filtered.length > 0 ? filtered[0] : null, error: null };
    }

    return { data: filtered, error: null };
  }

  then(onfulfilled: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Call real OpenAI API if user supplied key, otherwise fallback to template generation
async function callOpenAIIfConfigured(prompt: string, systemPrompt: string, responseFormatJson: boolean = false): Promise<string> {
  const apiKey = localStorage.getItem('openai_api_key');
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: responseFormatJson ? { type: 'json_object' } : undefined,
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.error('Failed to call real OpenAI API, falling back to mock generation:', e);
    }
  }

  // Pure client-side fallback generation when no API key is set
  return '';
}

// Main Mock Supabase Client Object
export const mockSupabase = {
  auth: {
    async signUp({ email, password, options }: any) {
      console.log('Mock signup email:', email);
      const mockUser: User = {
        id: uuid(),
        email,
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: options?.data || {},
        identities: [],
        factors: []
      };

      const mockSession: Session = {
        access_token: 'mock-access-token-' + uuid(),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token-' + uuid(),
        user: mockUser
      };

      // Save user to mock profiles table
      const profiles = getStorageJson('mock_db_profiles', []);
      profiles.push({
        id: mockUser.id,
        email: email,
        full_name: options?.data?.full_name || email.split('@')[0],
        onboarding_completed: false,
        created_at: new Date().toISOString()
      });
      setStorageJson('mock_db_profiles', profiles);

      // Cache session
      setStorageJson('learnflow_auth_session', { session: mockSession, timestamp: Date.now() });

      // Notify listeners
      setTimeout(() => this.triggerAuthStateChange('SIGNED_IN', mockSession), 50);

      return { data: { user: mockUser, session: mockSession }, error: null };
    },

    async signInWithPassword({ email, password }: any) {
      console.log('Mock signin email:', email);
      
      let profiles = getStorageJson('mock_db_profiles', []);
      let userProfile = profiles.find((p: any) => p.email === email);
      
      const userId = userProfile ? userProfile.id : uuid();
      if (!userProfile) {
        // Create profile on-the-fly for demo convenience
        userProfile = {
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          onboarding_completed: false,
          created_at: new Date().toISOString()
        };
        profiles.push(userProfile);
        setStorageJson('mock_db_profiles', profiles);
      }

      const mockUser: User = {
        id: userId,
        email,
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: userProfile.full_name },
        identities: [],
        factors: []
      };

      const mockSession: Session = {
        access_token: 'mock-access-token-' + uuid(),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token-' + uuid(),
        user: mockUser
      };

      // Cache session
      setStorageJson('learnflow_auth_session', { session: mockSession, timestamp: Date.now() });

      // Notify listeners
      setTimeout(() => this.triggerAuthStateChange('SIGNED_IN', mockSession), 50);

      return { data: { user: mockUser, session: mockSession }, error: null };
    },

    async signOut() {
      console.log('Mock signout called');
      localStorage.removeItem('learnflow_auth_session');
      setTimeout(() => this.triggerAuthStateChange('SIGNED_OUT', null), 50);
      return { error: null };
    },

    async getSession() {
      const cached = localStorage.getItem('learnflow_auth_session');
      if (cached) {
        const { session } = JSON.parse(cached);
        return { data: { session }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    async getUser() {
      const cached = localStorage.getItem('learnflow_auth_session');
      if (cached) {
        const { session } = JSON.parse(cached);
        return { data: { user: session?.user ?? null }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    listeners: new Set<Function>(),

    onAuthStateChange(callback: any) {
      this.listeners.add(callback);
      
      // Instantly run once with current session
      const cached = localStorage.getItem('learnflow_auth_session');
      const session = cached ? JSON.parse(cached).session : null;
      callback('INITIAL_SESSION', session);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners.delete(callback);
            }
          }
        }
      };
    },

    triggerAuthStateChange(event: string, session: Session | null) {
      this.listeners.forEach(callback => callback(event, session));
    },

    async resetPasswordForEmail(email: string) {
      console.log('Mock password reset requested for:', email);
      return { data: {}, error: null };
    },

    async resend(options: any) {
      console.log('Mock verification email resend requested');
      return { data: {}, error: null };
    }
  },

  from(table: string) {
    return new MockQueryBuilder(table);
  },

  // Mock Database RPC procedures
  async rpc(name: string, args: any) {
    console.log(`Mock RPC call: ${name}`, args);
    
    if (name === 'toggle_like') {
      const paths = getStorageJson('mock_db_learning_paths', []);
      const path = paths.find((p: any) => p.id === args.path_id);
      if (path) {
        path.likes = (path.likes || 0) + (path.user_liked ? -1 : 1);
        path.user_liked = !path.user_liked;
        setStorageJson('mock_db_learning_paths', paths);
        return { data: path.likes, error: null };
      }
      return { data: 0, error: null };
    }

    if (name === 'increment_view_count') {
      const paths = getStorageJson('mock_db_learning_paths', []);
      const path = paths.find((p: any) => p.id === args.path_id);
      if (path) {
        path.views = (path.views || 0) + 1;
        setStorageJson('mock_db_learning_paths', paths);
      }
      return { data: null, error: null };
    }

    if (name === 'fork_learning_path') {
      const paths = getStorageJson('mock_db_learning_paths', []);
      const path = paths.find((p: any) => p.id === args.path_id);
      if (path) {
        const sessionData = getStorageJson('learnflow_auth_session', null);
        const userId = sessionData?.session?.user?.id || 'demo-user-id';
        const newPathId = uuid();
        
        // Clone path
        const newPath = {
          ...path,
          id: newPathId,
          user_id: userId,
          forked_from: path.id,
          likes: 0,
          views: 0,
          created_at: new Date().toISOString()
        };
        paths.push(newPath);
        setStorageJson('mock_db_learning_paths', paths);

        // Clone steps
        const steps = getStorageJson('mock_db_learning_steps', []);
        const pathSteps = steps.filter((s: any) => s.path_id === args.path_id);
        const newSteps = pathSteps.map((s: any) => ({
          ...s,
          id: uuid(),
          path_id: newPathId,
          created_at: new Date().toISOString()
        }));
        setStorageJson('mock_db_learning_steps', [...steps, ...newSteps]);

        return { data: newPathId, error: null };
      }
      return { data: null, error: { message: 'Original path not found' } };
    }

    return { data: null, error: null };
  },

  removeChannel(channel: any) {
    // No-op for mock realtime subscription channels
  },

  channel(name: string) {
    return {
      on: () => ({
        subscribe: () => ({})
      })
    };
  },

  // Mock Supabase Edge Functions
  functions: {
    async invoke(name: string, options: any = {}) {
      console.log(`Mocking Edge Function: ${name}`, options?.body);
      const body = options.body || {};

      // 1. generate-learning-journey
      if (name === 'generate-learning-journey') {
        const action = body.action;

        if (action === 'generate-topics') {
          const interest = body.interest?.category || body.interest?.freeText || 'General Tech';
          
          const system = 'Generate 30-40 diverse, specific learning topics. Just topic names, nothing else. Respond with valid JSON.';
          const prompt = `Based on this interest: ${interest}, generate 30-40 specific, diverse learning topics. Return ONLY this JSON structure:\n{\n  "topics": ["Topic name 1", "Topic name 2", ... 30-40 total]\n}`;
          
          const gptRes = await callOpenAIIfConfigured(prompt, system, true);
          if (gptRes) {
            try {
              return { data: JSON.parse(gptRes), error: null };
            } catch {}
          }

          // Fallback static topics if no API key or parsing failed
          const fallbackTopics: Record<string, string[]> = {
            coding: [
              'React Framework Foundations', 'Python for Data Automation', 'Next.js 14 Server Components',
              'Advanced TypeScript Utility Types', 'SQL Optimization & Indexing', 'Tailwind CSS Customization',
              'Docker Containerization for Beginners', 'Node.js Event Loop Deep Dive', 'GraphQL Schema Design',
              'REST API Best Practices', 'Git Rebase and Workflow Strategies', 'Vite & Frontend Bundlers',
              'Zustand and Modern React State', 'CSS Grid & Flexbox Mastery', 'Testing React with Vitest'
            ],
            design: [
              'Figma Auto-Layout Techniques', 'Typography Rules in UI Design', 'Color Theory for Digital Screens',
              'Design Systems & Component Libraries', 'Mobile App Interaction Guidelines', 'Micro-interactions in CSS',
              'Wireframing to High-Fidelity Prototypes', 'User Persona Creation', 'Accessibility (WCAG) Guidelines',
              'Landing Page Conversion Design'
            ],
            business: [
              'Product Metrics & Analytics', 'SaaS Pricing Strategies', 'Financial Modeling in Excel',
              'Customer Acquisition Cost Optimization', 'Agile Product Management', 'Scrum Framework Execution',
              'Cold Email Strategy & Copywriting', 'SEO Optimization Fundamentals'
            ]
          };

          const matchedKey = Object.keys(fallbackTopics).find(k => interest.toLowerCase().includes(k)) || 'coding';
          return { data: { topics: fallbackTopics[matchedKey] }, error: null };
        }

        if (action === 'generate-skills') {
          const topicTitle = body.topic?.title || 'Selected Topic';
          
          const system = 'Generate 30-40 subtopics based on the parent topic. Just names. Respond with valid JSON.';
          const prompt = `For the topic "${topicTitle}", generate 30-40 related subtopics someone could dive deeper into. Return ONLY this JSON structure:\n{\n  "skills": ["Subtopic 1", "Subtopic 2", ... 30-40 total]\n}`;
          
          const gptRes = await callOpenAIIfConfigured(prompt, system, true);
          if (gptRes) {
            try {
              return { data: JSON.parse(gptRes), error: null };
            } catch {}
          }

          return {
            data: {
              skills: [
                `Fundamentals of ${topicTitle}`,
                `Advanced setup & config for ${topicTitle}`,
                `Best practices with ${topicTitle}`,
                `State Management & Architecture in ${topicTitle}`,
                `Performance Tuning of ${topicTitle}`,
                `Security Considerations in ${topicTitle}`,
                `Debugging and Troubleshooting ${topicTitle}`,
                `Deploying and scaling ${topicTitle} projects`,
                `Integrating third-party APIs with ${topicTitle}`
              ]
            },
            error: null
          };
        }

        if (action === 'generate-plan') {
          const topicTitle = body.topic?.title || 'Selected Topic';
          const selectedSkillsList = (body.skills || []).map((s: any) => `${s.name} (${s.level})`).join(', ');

          const system = 'Create a detailed, actionable learning plan.';
          const prompt = `Create a personalized learning plan for someone learning "${topicTitle}" with these selected skills: ${selectedSkillsList}. Return JSON matching format: {"title": "", "description": "", "totalDuration": "", "weeklyCommitment": "", "milestones": [{"week": 1, "title": "", "description": "", "tasks": []}], "firstProject": {"title": "", "description": "", "skills": [], "estimatedTime": ""}, "resources": [{"type": "", "title": "", "duration": "", "free": true}], "nextSteps": []}`;

          const gptRes = await callOpenAIIfConfigured(prompt, system, true);
          if (gptRes) {
            try {
              return { data: JSON.parse(gptRes), error: null };
            } catch {}
          }

          // Fallback static plan
          return {
            data: {
              title: `${topicTitle} Mastery Pathway`,
              description: `A fast-track roadmap designed to build solid capabilities in ${topicTitle} through continuous project-based execution.`,
              totalDuration: '6 weeks',
              weeklyCommitment: '6-8 hours/week',
              milestones: [
                {
                  week: 1,
                  title: 'Foundations & Tooling Setup',
                  description: 'Gain familiarity with core elements and establish developer workflow.',
                  tasks: [
                    'Read baseline documentation and complete tutorials',
                    'Configure standard IDE extensions and linting rules',
                    'Initialize a clean repository template'
                  ]
                },
                {
                  week: 2,
                  title: 'Core Concepts & Implementations',
                  description: 'Start building small-scale functions and component logic.',
                  tasks: [
                    'Write custom hooks/methods for modularity',
                    'Practice data manipulation and input state parsing',
                    'Run unit testing verification cycles'
                  ]
                },
                {
                  week: 3,
                  title: 'Intermediate Architecture',
                  description: 'Refactor code into scalable modular units.',
                  tasks: [
                    'Apply advanced lifecycle/rendering lifecycle hooks',
                    'Integrate external web API endpoints',
                    'Handle promise state transitions and exception pathways'
                  ]
                }
              ],
              firstProject: {
                title: `${topicTitle} Sandbox Application`,
                description: `A fully functioning dashboard that demonstrates routing, storage interaction, and dynamic layouts using ${topicTitle}.`,
                skills: ['Core Logic', 'State Sync', 'Responsive UI Layouts'],
                estimatedTime: '8 hours'
              },
              resources: [
                {
                  type: 'documentation',
                  title: `Official ${topicTitle} Reference Manual`,
                  duration: '2 hours',
                  free: true
                },
                {
                  type: 'video',
                  title: `${topicTitle} Complete Video Tutorial`,
                  duration: '3 hours',
                  free: true
                }
              ],
              nextSteps: [
                'Refactor with persistent store managers',
                'Introduce performance measurement profiles'
              ]
            },
            error: null
          };
        }
      }

      // 2. generate-learning-content
      if (name === 'generate-learning-content') {
        const stepId = body.stepId;
        const topic = body.topic || 'General concept';
        const title = body.title || 'Introduction';
        const stepNumber = body.stepNumber || 1;
        const totalSteps = body.totalSteps || 5;

        if (body.generatePlan) {
          // Trigger plan generation helper
          const planData = {
            id: uuid(),
            title: `Learning Path: ${topic}`,
            description: `Generated outline for ${topic}`,
            created_at: new Date().toISOString()
          };
          
          // Save path to db
          const paths = getStorageJson('mock_db_learning_paths', []);
          paths.push(planData);
          setStorageJson('mock_db_learning_paths', paths);

          const generatedSteps = [
            { title: `Foundations of ${topic}`, description: `Learn the fundamentals, environment setup, and basic syntax of ${topic}.` },
            { title: `Core Concepts & Workflows in ${topic}`, description: `Master essential structures, functions, and key workflows in ${topic}.` },
            { title: `Practical Implementation & Building`, description: `Build practical scripts and modules to solve real-world problems.` },
            { title: `Advanced Techniques & Integration`, description: `Implement error handling, optimization, and integrations.` },
            { title: `Capstone Project & Best Practices`, description: `Design and publish a production-ready end-to-end ${topic} project.` }
          ];

          for (let i = 0; i < generatedSteps.length; i++) {
            steps.push({
              id: uuid(),
              path_id: planData.id,
              title: generatedSteps[i].title,
              description: generatedSteps[i].description,
              step_number: i + 1,
              detailed_content: null,
              created_at: new Date().toISOString()
            });
          }
          const allSteps = getStorageJson('mock_db_learning_steps', []);
          setStorageJson('mock_db_learning_steps', [...allSteps, ...steps]);

          return { data: { ...planData, steps: generatedSteps }, error: null };
        }

        // Return step contents
        const system = `You are a friendly, expert tutor explaining ${topic} to a student. Generate comprehensive markdown text with code snippets.`;
        const prompt = `Write an educational lesson on the topic "${title}". This is step ${stepNumber} of ${totalSteps}. Support it with explanations, markdown headings, code blocks, analogies, and a summary.`;
        
        const gptContent = await callOpenAIIfConfigured(prompt, system, false);
        let lessonMarkdown = gptContent;

        if (!lessonMarkdown) {
          // Detailed placeholder markdown content
          lessonMarkdown = `# Understanding ${title}\n\n` +
            `Welcome to Step ${stepNumber} of ${totalSteps} in your journey to master **${topic}**.\n\n` +
            `In this section, we cover the core structures that define **${title}**. Understanding this is critical because it forms the backbone of advanced workflows.\n\n` +
            `## Core Principles\n\n` +
            `When working with this topic, keep these three guidelines in mind:\n` +
            `1. **Declarative Architecture**: Code should represent *what* we want to happen, not *how* to step-by-step achieve it.\n` +
            `2. **Isolation of State**: Keep concerns separate to ensure maintainability.\n` +
            `3. **Predictable Data Flows**: Data should flow uni-directionally to facilitate easier debugging.\n\n` +
            `### Visual Analogy\n\n` +
            `Think of this concept like an assembly line: each station performs a single task and forwards the product to the next. If an item breaks at station 3, you immediately know where the error lies instead of searching the entire factory floor.\n\n` +
            `## Code Example\n\n` +
            `Here is how you typically structure this in production:\n\n` +
            `\`\`\`typescript\n` +
            `interface Config {\n` +
            `  id: string;\n` +
            `  enabled: boolean;\n` +
            `}\n\n` +
            `function initializeModule(config: Config): void {\n` +
            `  console.log("Initializing module ID:", config.id);\n` +
            `  if (config.enabled) {\n` +
            `    // Perform active mounting\n` +
            `  }\n` +
            `}\n` +
            `\`\`\`\n\n` +
            `## Challenges and Best Practices\n\n` +
            `* **Avoid Over-engineering**: Start with the simplest code structure first. Refactor only when performance metrics indicate bottlenecking.\n` +
            `* **Comprehensive Testing**: Write unit tests covering both positive paths and common error boundaries.\n\n` +
            `### Summary\n\n` +
            `You now have a solid understanding of ${title}. In the next lesson, we will build on this to hook up live network endpoints. Try writing your own simple setup to solidify these concepts!`;
        }

        // Save detailed_content back to localStorage DB
        const steps = getStorageJson('mock_db_learning_steps', []);
        const step = steps.find((s: any) => s.id === stepId);
        if (step) {
          step.detailed_content = lessonMarkdown;
          setStorageJson('mock_db_learning_steps', steps);
        }

        return { data: { content: lessonMarkdown }, error: null };
      }

      // 3. chat-tutor
      if (name === 'chat-tutor') {
        const messageList = body.messages || [];
        const userMessage = messageList[messageList.length - 1]?.content || 'Hello';
        
        const system = 'You are a friendly, helpful AI learning tutor. Help the student understand their lesson or answer their questions.';
        const prompt = `The student is asking: "${userMessage}". Answer them concisely and helpfully.`;

        const gptRes = await callOpenAIIfConfigured(prompt, system, false);
        if (gptRes) {
          return { data: { result: gptRes }, error: null };
        }

        return {
          data: {
            result: `Hey there! That is a great question about the lesson. \n\n` +
              `Essentially, you want to keep your modules isolated. When you implement it this way, you reduce side-effects, making testing much easier. \n\n` +
              `Do you have a specific code snippet or concept in this step you want me to explain further?`
          },
          error: null
        };
      }

      // 4. generate-mental-model-images
      if (name === 'generate-mental-model-images' || name === 'generate-presentation-image') {
        return {
          data: {
            images: [
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
              'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&auto=format&fit=crop&q=60'
            ]
          },
          error: null
        };
      }

      // 5. openai-tts or text-to-speech
      if (name === 'openai-tts' || name === 'text-to-speech') {
        // Return a dummy audio url or handle it
        return {
          data: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
          },
          error: null
        };
      }

      // 6. get-prompt-insights
      if (name === 'get-prompt-insights') {
        return {
          data: {
            insights: [],
            topCategories: [],
            unansweredQuestions: [],
            suggestedTopics: []
          },
          error: null
        };
      }

      // 7. get-predictive-recommendations / get-recommended-topics / get-skill-gaps
      if (name.startsWith('get-')) {
        return {
          data: {
            recommendations: [
              { title: 'Responsive Design Mastery', level: 'intermediate', reason: 'Matches your focus on CSS' },
              { title: 'Asynchronous State Management', level: 'advanced', reason: 'Fits your React track' }
            ],
            gaps: [
              { skill: 'Testing Strategy', level: 'beginner', progress: 10 }
            ],
            profile: {
              learning_style: 'visual',
              pace: 'standard'
            }
          },
          error: null
        };
      }

      // Default mock fallback response
      return { data: {}, error: null };
    }
  }
};

