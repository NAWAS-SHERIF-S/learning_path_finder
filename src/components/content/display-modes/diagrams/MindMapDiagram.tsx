import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

interface MindMapDiagramProps {
  topic: string;
}

export const MindMapDiagram: React.FC<MindMapDiagramProps> = ({ topic }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  
  // Refs for branches
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const branches = [
    { label: "Core Principles", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { label: "Data Input", color: "bg-green-100 text-green-800 border-green-200" },
    { label: "Processing", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { label: "Automation", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { label: "Output", color: "bg-rose-100 text-rose-800 border-rose-200" },
  ];

  // Helper to safely register branch refs
  const setBranchRef = (el: HTMLDivElement | null, index: number) => {
    branchRefs.current[index] = el;
  };

  const drawLines = () => {
    if (!containerRef.current || !centerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerRect = centerRef.current.getBoundingClientRect();
    
    const centerX = (centerRect.left + centerRect.right) / 2 - containerRect.left;
    const centerY = (centerRect.top + centerRect.bottom) / 2 - containerRect.top;

    const newLines = branchRefs.current.map((branchEl) => {
      if (!branchEl) return { x1: centerX, y1: centerY, x2: centerX, y2: centerY };
      
      const branchRect = branchEl.getBoundingClientRect();
      const branchX = (branchRect.left + branchRect.right) / 2 - containerRect.left;
      const branchY = (branchRect.top + branchRect.bottom) / 2 - containerRect.top;
      
      return { x1: centerX, y1: centerY, x2: branchX, y2: branchY };
    });

    setLines(newLines);
  };

  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(drawLines, 100);
    window.addEventListener('resize', drawLines);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', drawLines);
    };
  }, [topic]); // Re-draw if topic changes and sizes change

  // Split branches into left and right columns
  const leftBranches = branches.slice(0, Math.ceil(branches.length / 2));
  const rightBranches = branches.slice(Math.ceil(branches.length / 2));

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
      <h3 className="absolute top-4 left-4 text-sm font-bold text-gray-500 uppercase tracking-widest z-20">Mind Map</h3>
      
      {/* Scrollable container for smaller screens */}
      <div className="w-full overflow-x-auto pb-6">
        <div 
          ref={containerRef}
          className="relative min-w-[700px] flex items-center justify-between gap-8 mx-auto py-10"
        >
          {/* SVG connecting lines (absolute positioned under nodes) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {lines.map((line, i) => (
              <motion.path
                key={`line-${i}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            ))}
          </svg>

          {/* Left Column */}
          <div className="flex flex-col gap-6 z-10 w-1/4">
            {leftBranches.map((branch, i) => (
              <motion.div
                key={`left-node-${i}`}
                ref={(el) => setBranchRef(el, i)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className={`w-full px-4 py-3 rounded-lg border shadow-sm text-sm font-semibold flex items-center justify-center text-center leading-snug break-words ${branch.color}`}
              >
                {branch.label}
              </motion.div>
            ))}
          </div>

          {/* Central Node */}
          <div className="flex justify-center z-10 w-2/4">
            <motion.div 
              ref={centerRef}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-brand-purple text-white rounded-full flex flex-col items-center justify-center p-6 text-center shadow-xl border-4 border-white aspect-square min-w-[160px] max-w-[220px]"
            >
              <BrainCircuit className="w-8 h-8 mb-2 opacity-90 flex-shrink-0" />
              <span className="font-bold text-sm md:text-base leading-tight">{topic}</span>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 z-10 w-1/4">
            {rightBranches.map((branch, i) => (
              <motion.div
                key={`right-node-${i}`}
                ref={(el) => setBranchRef(el, i + leftBranches.length)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + ((i + leftBranches.length) * 0.1) }}
                className={`w-full px-4 py-3 rounded-lg border shadow-sm text-sm font-semibold flex items-center justify-center text-center leading-snug break-words ${branch.color}`}
              >
                {branch.label}
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
