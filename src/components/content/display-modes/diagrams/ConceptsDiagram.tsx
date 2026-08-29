import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

interface ConceptsDiagramProps {
  topic: string;
}

export const ConceptsDiagram: React.FC<ConceptsDiagramProps> = ({ topic }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  
  const level1Refs = useRef<(HTMLDivElement | null)[]>([]);
  const level2Refs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  // We are creating a simple tree: Root -> 2 Children -> 1 Sub-child each
  const conceptTree = [
    {
      title: "Data Core", color: "bg-amber-100 text-amber-800 border-amber-200",
      children: [{ title: "Pandas/DataFrames", color: "bg-blue-100 text-blue-800 border-blue-200" }]
    },
    {
      title: "Workflow Engine", color: "bg-purple-100 text-purple-800 border-purple-200",
      children: [{ title: "Automated Scripts", color: "bg-green-100 text-green-800 border-green-200" }]
    }
  ];

  const setLevel1Ref = (el: HTMLDivElement | null, index: number) => {
    level1Refs.current[index] = el;
  };
  
  const setLevel2Ref = (el: HTMLDivElement | null, index: number) => {
    level2Refs.current[index] = el;
  };

  const drawLines = () => {
    if (!containerRef.current || !rootRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const rootRect = rootRef.current.getBoundingClientRect();
    
    const rootBottomX = (rootRect.left + rootRect.right) / 2 - containerRect.left;
    const rootBottomY = rootRect.bottom - containerRect.top;

    const newLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    // Connect Root to Level 1
    level1Refs.current.forEach((childEl, i) => {
      if (!childEl) return;
      const childRect = childEl.getBoundingClientRect();
      const childTopX = (childRect.left + childRect.right) / 2 - containerRect.left;
      const childTopY = childRect.top - containerRect.top;
      
      newLines.push({ x1: rootBottomX, y1: rootBottomY, x2: childTopX, y2: childTopY });

      // Connect Level 1 to Level 2
      const subChildEl = level2Refs.current[i];
      if (subChildEl) {
        const subRect = subChildEl.getBoundingClientRect();
        const childBottomX = childTopX;
        const childBottomY = childRect.bottom - containerRect.top;
        
        const subTopX = (subRect.left + subRect.right) / 2 - containerRect.left;
        const subTopY = subRect.top - containerRect.top;
        
        newLines.push({ x1: childBottomX, y1: childBottomY, x2: subTopX, y2: subTopY });
      }
    });

    setLines(newLines);
  };

  useEffect(() => {
    const timer = setTimeout(drawLines, 100);
    window.addEventListener('resize', drawLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', drawLines);
    };
  }, [topic]);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-8 flex flex-col items-center relative overflow-hidden min-h-[400px]">
      <h3 className="absolute top-4 left-4 text-sm font-bold text-gray-500 uppercase tracking-widest z-20">Concept Map</h3>

      <div className="w-full overflow-x-auto pb-6 mt-8">
        <div 
          ref={containerRef}
          className="relative min-w-[600px] flex flex-col items-center gap-12 mx-auto pt-6"
        >
          {/* SVG Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {lines.map((line, i) => (
              <motion.path
                key={`line-${i}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                // Cubic bezier for a smooth vertical S-curve
                d={`M ${line.x1} ${line.y1} C ${line.x1} ${(line.y1 + line.y2) / 2}, ${line.x2} ${(line.y1 + line.y2) / 2}, ${line.x2} ${line.y2}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* Root Node */}
          <div className="z-10 px-4">
            <motion.div 
              ref={rootRef}
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring" }}
              className="bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/30 px-6 py-4 rounded-xl font-bold shadow-sm flex flex-col items-center gap-2 max-w-[280px] text-center leading-snug break-words"
            >
              <Share2 className="w-5 h-5" /> 
              <span>{topic}</span>
            </motion.div>
          </div>

          {/* Level 1 & 2 Branches */}
          <div className="flex w-full justify-around z-10 px-8">
            {conceptTree.map((branch, i) => (
              <div key={i} className="flex flex-col items-center gap-12">
                <motion.div 
                  ref={(el) => setLevel1Ref(el, i)}
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", delay: 0.2 }}
                  className={`px-5 py-3 rounded-xl border-2 font-bold shadow-sm max-w-[220px] text-center leading-snug break-words ${branch.color}`}
                >
                  {branch.title}
                </motion.div>

                {branch.children.map((sub, j) => (
                  <motion.div 
                    key={j}
                    ref={(el) => setLevel2Ref(el, i)}
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", delay: 0.4 }}
                    className={`px-4 py-2 rounded-xl border-2 font-bold shadow-sm max-w-[200px] text-center text-sm leading-snug break-words ${sub.color}`}
                  >
                    {sub.title}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
