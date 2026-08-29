import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Network, Zap, Lightbulb } from 'lucide-react';

interface MentalModelsModeProps {
  topic: string;
}

export const MentalModelsMode: React.FC<MentalModelsModeProps> = ({ topic }) => {
  // Use fallback generic mental model related to the topic if the backend is down
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Mental Model: {topic}</h3>
        </div>
        
        <p className="text-gray-600 leading-relaxed mb-6">
          To truly understand <strong>{topic}</strong>, it helps to build a mental framework. 
          Here is a core mental model you can use to structure your knowledge.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Core Idea */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-brand-primary mb-3">
              <Zap className="w-4 h-4" />
              <h4 className="font-semibold">The Core Idea</h4>
            </div>
            <p className="text-sm text-gray-700">
              At its heart, {topic} is about transforming inputs into valuable outputs through a structured, predictable pipeline.
            </p>
          </div>

          {/* How it Works */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-brand-accent mb-3">
              <Network className="w-4 h-4" />
              <h4 className="font-semibold">How It Works</h4>
            </div>
            <p className="text-sm text-gray-700">
              Input → Process → Transform → Validate → Output. By breaking down the problem into these sequential stages, complexity becomes manageable.
            </p>
          </div>
          
          {/* Analogy */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 md:col-span-2">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <Lightbulb className="w-4 h-4" />
              <h4 className="font-semibold">Simple Analogy</h4>
            </div>
            <p className="text-sm text-gray-700">
              Think of {topic} like a factory assembly line. Raw materials (data/inputs) enter the factory. At each station, a specific machine (function/process) performs one job perfectly. Finally, quality control checks the result before it ships. If a machine breaks, you know exactly where to look.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MentalModelsMode;
