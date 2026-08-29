import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

interface MindMapDiagramProps {
  topic: string;
}

export const MindMapDiagram: React.FC<MindMapDiagramProps> = ({ topic }) => {
  const branches = [
    { label: "Core Principles", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { label: "Data Input", color: "bg-green-100 text-green-800 border-green-200" },
    { label: "Processing", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { label: "Automation", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { label: "Output", color: "bg-rose-100 text-rose-800 border-rose-200" },
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
      <h3 className="absolute top-4 left-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Mind Map</h3>
      
      {/* Container for absolute positioning relative to center */}
      <div className="relative w-full max-w-lg h-64 flex items-center justify-center mt-6">
        
        {/* SVG connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
          {branches.map((_, i) => {
            const angle = (i * (360 / branches.length)) * (Math.PI / 180);
            const radius = 120; // Distance to branch center
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <motion.line 
                key={`line-${i}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                x1="50%" y1="50%" 
                x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`}
                stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* Central Node */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute z-10 w-32 h-32 bg-brand-purple text-white rounded-full flex flex-col items-center justify-center p-4 text-center shadow-lg border-4 border-white"
        >
          <BrainCircuit className="w-6 h-6 mb-1 opacity-80" />
          <span className="font-bold text-sm leading-tight line-clamp-3">{topic}</span>
        </motion.div>

        {/* Branch Nodes */}
        {branches.map((branch, i) => {
          const angle = (i * (360 / branches.length)) * (Math.PI / 180);
          const radius = 140; 
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={`node-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`absolute z-10 px-3 py-2 rounded-lg border shadow-sm text-xs font-semibold whitespace-nowrap ${branch.color}`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {branch.label}
            </motion.div>
          );
        })}

      </div>
    </div>
  );
};
