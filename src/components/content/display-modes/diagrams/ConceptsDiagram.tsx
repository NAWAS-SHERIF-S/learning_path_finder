import React from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

interface ConceptsDiagramProps {
  topic: string;
}

export const ConceptsDiagram: React.FC<ConceptsDiagramProps> = ({ topic }) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex items-center justify-center relative overflow-hidden">
      <h3 className="absolute top-4 left-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Concept Map: {topic}</h3>

      <div className="relative w-full max-w-lg h-64 mt-8 flex justify-center">
        {/* Lines connecting nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          <motion.line 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
            x1="50%" y1="20%" x2="25%" y2="60%" stroke="#e2e8f0" strokeWidth="2" 
          />
          <motion.line 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }}
            x1="50%" y1="20%" x2="50%" y2="80%" stroke="#e2e8f0" strokeWidth="2" 
          />
          <motion.line 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.4 }}
            x1="50%" y1="20%" x2="75%" y2="60%" stroke="#e2e8f0" strokeWidth="2" 
          />
          <motion.line 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.6 }}
            x1="25%" y1="60%" x2="50%" y2="80%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" 
          />
          <motion.line 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.8 }}
            x1="75%" y1="60%" x2="50%" y2="80%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" 
          />
        </svg>

        {/* Nodes */}
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-100 text-blue-800 border-2 border-blue-200 px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" /> {topic}
        </motion.div>

        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="absolute top-[60%] left-[25%] -translate-x-1/2 -translate-y-1/2 bg-amber-100 text-amber-800 border-2 border-amber-200 px-4 py-2 rounded-xl font-bold shadow-sm"
        >
          Pandas/Data
        </motion.div>

        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.4 }}
          className="absolute top-[80%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-purple-100 text-purple-800 border-2 border-purple-200 px-4 py-2 rounded-xl font-bold shadow-sm"
        >
          Automation Workflow
        </motion.div>

        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.6 }}
          className="absolute top-[60%] left-[75%] -translate-x-1/2 -translate-y-1/2 bg-green-100 text-green-800 border-2 border-green-200 px-4 py-2 rounded-xl font-bold shadow-sm"
        >
          Output & Reports
        </motion.div>

      </div>
    </div>
  );
};
