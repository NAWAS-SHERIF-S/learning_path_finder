import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenText, ArrowRight, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SafeReactMarkdown from '@/components/ui/SafeReactMarkdown';

interface StoryModeProps {
  topic: string;
}

interface StoryNode {
  id: number;
  content: string;
  actionText: string;
}

export const StoryMode: React.FC<StoryModeProps> = ({ topic }) => {
  const [currentNodeId, setCurrentNodeId] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

  // Fallback narrative flow based on topic
  const storyNodes: StoryNode[] = [
    {
      id: 1,
      content: `**The Morning Chaos**\n\nImagine you are Alex, a Data Analyst at a growing e-commerce company. It's Monday morning, 8:00 AM. You open your inbox to find 500 emails from regional managers, each containing a CSV file of the weekend's sales data.\n\nYour boss needs a consolidated report by 10:00 AM for the executive meeting. If you do this manually—opening each file, copying the data, pasting it into a master sheet, and fixing formatting errors—it will take you at least 3 days. Panic sets in.`,
      actionText: `Think of a solution using ${topic}`
    },
    {
      id: 2,
      content: `**The Revelation**\n\nYou take a deep breath and remember what you learned about **${topic}**. \n\nInstead of opening Excel, you open your code editor. You realize that while a human is slow at opening 500 files, a computer can do it in milliseconds. \n\nYou write a script that tells the computer: *"Look in the 'weekend_sales' folder. For every file ending in .csv, open it, grab the data, and stick it into one giant table."*`,
      actionText: `Run the script`
    },
    {
      id: 3,
      content: `**The Transformation**\n\nYou hit "Run". For a second, nothing seems to happen. Then, your terminal prints:\n\n\`Processed 500 files. 24,000 rows added to master_report.csv\`\n\nIt took 1.4 seconds. What would have taken you 72 hours of soul-crushing manual labor was completed before you could even take a sip of your coffee.\n\nNot only did you finish the report 2 hours early, but you also eliminated the risk of human error (like accidentally pasting data in the wrong column).`,
      actionText: `Present to the boss`
    },
    {
      id: 4,
      content: `**The Hero's Journey**\n\nAt the 10:00 AM meeting, your boss is stunned. "How did you get this done so fast?" \n\nYou explain the automated pipeline you built using **${topic}**. Now, every Monday, this script runs automatically on a server. You never have to touch those 500 emails again.\n\nThis is the power of automation: you trade a few hours of writing code today for hundreds of hours of free time in the future.`,
      actionText: `Finish Story`
    }
  ];

  const handleNext = () => {
    setCurrentNodeId(prev => prev + 1);
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  const activeNodes = storyNodes.filter(node => node.id <= currentNodeId);
  const currentNode = storyNodes.find(node => node.id === currentNodeId);
  const isFinished = currentNodeId > storyNodes.length;

  if (!hasStarted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 p-10 text-center max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center mb-6">
          <BookOpenText className="w-10 h-10 text-brand-purple" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">Learn through a Story</h3>
        <p className="text-gray-600 mb-8 text-lg max-w-md">
          Sometimes the best way to understand a technical concept like <strong>{topic}</strong> is to see it applied in a real-world scenario.
        </p>
        <Button onClick={handleStart} className="bg-brand-purple hover:bg-brand-purple/90 text-white px-8 py-6 text-lg rounded-xl shadow-md transition-all hover:scale-105">
          <Play className="w-5 h-5 mr-2" /> Start the Story
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 overflow-hidden max-w-3xl mx-auto min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-3">
        <BookOpenText className="w-5 h-5 text-brand-purple" />
        <h3 className="font-semibold text-gray-900">Interactive Story: {topic}</h3>
      </div>

      {/* Story Content Area */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-8">
        <AnimatePresence initial={false}>
          {activeNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative pl-8"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-brand-purple shadow-sm border-2 border-white z-10" />
              {/* Timeline line */}
              {index < activeNodes.length - 1 && (
                <div className="absolute left-[7px] top-4 bottom-[-40px] w-0.5 bg-gray-200 z-0" />
              )}
              
              <div className={cn(
                "prose prose-brand max-w-none prose-p:leading-relaxed",
                index === activeNodes.length - 1 ? "text-gray-900" : "text-gray-500"
              )}>
                <SafeReactMarkdown>{node.content}</SafeReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 bg-green-50 border border-green-200 rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-xl font-bold text-green-900 mb-2">Story Complete</h4>
            <p className="text-green-800 mb-6">
              You've seen how {topic} solves real-world problems.
            </p>
            <Button 
              onClick={() => { setCurrentNodeId(1); setHasStarted(false); }}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Read Again
            </Button>
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      {!isFinished && currentNode && (
        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button 
            onClick={handleNext}
            className="bg-brand-purple hover:bg-brand-purple/90 text-white px-6 py-6 h-auto shadow-md transition-all hover:translate-x-1"
          >
            <span className="text-base font-medium">{currentNode.actionText}</span>
            {currentNodeId === storyNodes.length ? (
              <CheckCircle2 className="w-5 h-5 ml-3" />
            ) : (
              <ArrowRight className="w-5 h-5 ml-3" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StoryMode;
