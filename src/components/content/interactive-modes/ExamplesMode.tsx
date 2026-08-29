import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, Lightbulb, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SafeReactMarkdown from '@/components/ui/SafeReactMarkdown';

interface ExamplesModeProps {
  topic: string;
}

export const ExamplesMode: React.FC<ExamplesModeProps> = ({ topic }) => {
  const [activeTab, setActiveTab] = useState<'beginner' | 'real-world' | 'code'>('beginner');

  // Fallback examples specific to data/coding tasks
  const examples = {
    'beginner': {
      title: 'A Simple Everyday Example',
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      content: `Imagine you have a stack of 100 paper invoices. \n\nIf you wanted to find the total amount spent, you would have to read each one, find the total, write it down, and add it all up with a calculator. This is a **manual process**.\n\nNow imagine if you had a magic scanner that could instantly read all 100 invoices and give you the total in 1 second. That's what **${topic}** does for digital data! It takes a repetitive, time-consuming task and handles it instantly.`
    },
    'real-world': {
      title: 'Real-World Business Scenario',
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      content: `**Scenario: The Monthly Finance Report**\n\nEvery month, a finance team receives CSV files from 5 different departments. They used to spend 3 days copying and pasting this data into a master spreadsheet.\n\n**The Solution using ${topic}:**\nThey created an automated pipeline that:\n1. Watches a specific folder for new CSV files.\n2. Automatically extracts the required columns.\n3. Cleans any mismatched dates.\n4. Merges them into a single report.\n\n**Result:** A 3-day process now takes 30 seconds.`
    },
    'code': {
      title: 'Practical Implementation',
      icon: <Code className="w-5 h-5 text-green-500" />,
      content: `Here is a simple example showing the core mechanics of ${topic}:\n\n\`\`\`python\nimport pandas as pd\nimport glob\n\n# 1. Input: Find all CSV files\nfiles = glob.glob("data/*.csv")\n\n# 2. Process: Read and combine\ncombined_data = pd.concat([pd.read_csv(f) for f in files])\n\n# 3. Transform: Clean the data\ncombined_data['Date'] = pd.to_datetime(combined_data['Date'])\ncombined_data = combined_data.dropna()\n\n# 4. Output: Save the result\ncombined_data.to_csv("final_report.csv", index=False)\nprint(f"Successfully processed {len(files)} files!")\n\`\`\``
    }
  };

  const activeContent = examples[activeTab];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2 overflow-x-auto">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('beginner')}
          className={cn(
            "flex-1 justify-center rounded-xl py-6 transition-all",
            activeTab === 'beginner' ? "bg-white shadow-sm border border-gray-200 text-brand-purple" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Lightbulb className={cn("w-4 h-4 mr-2", activeTab === 'beginner' && "text-amber-500")} /> 
          Beginner
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('real-world')}
          className={cn(
            "flex-1 justify-center rounded-xl py-6 transition-all",
            activeTab === 'real-world' ? "bg-white shadow-sm border border-gray-200 text-brand-purple" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <BookOpen className={cn("w-4 h-4 mr-2", activeTab === 'real-world' && "text-blue-500")} /> 
          Real-World
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('code')}
          className={cn(
            "flex-1 justify-center rounded-xl py-6 transition-all",
            activeTab === 'code' ? "bg-white shadow-sm border border-gray-200 text-brand-purple" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Code className={cn("w-4 h-4 mr-2", activeTab === 'code' && "text-green-500")} /> 
          Code Example
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                {activeContent.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{activeContent.title}</h3>
            </div>
            
            <div className="prose prose-brand max-w-none text-gray-700 prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl">
              <SafeReactMarkdown>{activeContent.content}</SafeReactMarkdown>
            </div>

            {activeTab === 'code' && (
              <div className="mt-6 flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-3 text-green-800 font-medium">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Expected Output
                </div>
                <div className="font-mono text-sm text-green-700">
                  Successfully processed 5 files!
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExamplesMode;
