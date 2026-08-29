import React from 'react';
import { motion } from 'framer-motion';
import { Database, Cpu, LayoutGrid, CheckCircle, BarChart3, ArrowDown } from 'lucide-react';

interface ArchitectureDiagramProps {
  topic: string;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ topic }) => {
  const steps = [
    { icon: <Database className="w-6 h-6 text-blue-500" />, title: "Data Sources", desc: "Raw inputs and files" },
    { icon: <Cpu className="w-6 h-6 text-purple-500" />, title: `${topic} Core`, desc: "Central processing logic" },
    { icon: <LayoutGrid className="w-6 h-6 text-amber-500" />, title: "Transformation", desc: "Structuring and cleaning" },
    { icon: <CheckCircle className="w-6 h-6 text-green-500" />, title: "Validation", desc: "Quality assurance checks" },
    { icon: <BarChart3 className="w-6 h-6 text-rose-500" />, title: "Output & Reports", desc: "Final deliverables" }
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
      <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">System Architecture: {topic}</h3>
      <div className="flex flex-col items-center w-full max-w-sm space-y-2">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="p-2 bg-white rounded-md shadow-sm border border-gray-100">
                {step.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </motion.div>
            
            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (index * 0.1) + 0.05 }}
              >
                <ArrowDown className="w-5 h-5 text-gray-300" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
