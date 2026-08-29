import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileInput, Filter, Code2, Bot, FileOutput } from 'lucide-react';

interface ProcessFlowDiagramProps {
  topic: string;
}

export const ProcessFlowDiagram: React.FC<ProcessFlowDiagramProps> = ({ topic }) => {
  const steps = [
    { icon: <FileInput className="w-5 h-5 text-gray-700" />, label: "Input" },
    { icon: <Filter className="w-5 h-5 text-blue-600" />, label: "Read Data" },
    { icon: <Code2 className="w-5 h-5 text-amber-600" />, label: "Transform" },
    { icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />, label: "Validate" },
    { icon: <Bot className="w-5 h-5 text-purple-600" />, label: "Automate" },
    { icon: <FileOutput className="w-5 h-5 text-rose-600" />, label: "Output" }
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col justify-center overflow-x-auto min-h-[300px]">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10 text-center">Process Flow: {topic}</h3>
      
      <div className="flex items-center justify-start md:justify-center min-w-max pb-4 px-4 gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-gray-200 shadow-sm flex items-center justify-center mb-3">
                {step.icon}
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{step.label}</span>
            </motion.div>

            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index * 0.15) + 0.1 }}
                className="mx-2 mb-6"
              >
                <ArrowRight className="w-6 h-6 text-gray-300" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Extracted just to keep imports clean above
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
