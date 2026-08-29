import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Send, Lightbulb, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface SocraticModeProps {
  topic: string;
}

interface SocraticStep {
  id: number;
  question: string;
  hint: string;
  expectedConcept: string;
  explanation: string;
}

export const SocraticMode: React.FC<SocraticModeProps> = ({ topic }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Fallback sequence specifically designed for a typical concept like Python Data Automation or generalized if not match
  const steps: SocraticStep[] = [
    {
      id: 1,
      question: `What do you think is the very first step when automating a process involving ${topic}?`,
      hint: 'Think about where the information originates from before you can do anything with it.',
      expectedConcept: 'input/reading',
      explanation: 'Exactly! Before any automation or processing can happen, you must first acquire or read the input data (e.g., reading a CSV file or fetching from an API).'
    },
    {
      id: 2,
      question: 'Once the data is loaded, what is typically the next logical step before using it in calculations?',
      hint: 'Raw data is rarely perfect. What needs to happen to make it usable?',
      expectedConcept: 'cleaning/processing',
      explanation: 'Spot on. Cleaning and transforming the data is essential. This ensures the automated pipeline does not crash due to missing values or incorrect formats.'
    },
    {
      id: 3,
      question: `How does breaking the automation into these distinct steps help you maintain the ${topic} pipeline?`,
      hint: 'Consider what happens when something breaks. Is it easier to fix a single massive script or smaller modular pieces?',
      expectedConcept: 'modular/debug/maintain',
      explanation: 'Great insight! A modular approach means if the data source changes, you only update the "Input" step, leaving the transformation and output steps untouched.'
    }
  ];

  const currentStep = steps[currentStepIndex];
  const isFinished = currentStepIndex >= steps.length;

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    
    // Simple naive check for mock Socratic flow
    const isConceptFound = inputValue.toLowerCase().includes(currentStep.expectedConcept.split('/')[0]) || 
                           (currentStep.expectedConcept.includes('/') && inputValue.toLowerCase().includes(currentStep.expectedConcept.split('/')[1]));
                           
    setIsCorrect(isConceptFound || inputValue.length > 10); // Assume correct if they write a decent length answer as fallback
    setHasSubmitted(true);
  };

  const handleNext = () => {
    setCurrentStepIndex(prev => prev + 1);
    setInputValue('');
    setShowHint(false);
    setHasSubmitted(false);
  };

  if (isFinished) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Great job!</h3>
        <p className="text-gray-600 mb-6">
          You've explored the core concepts of {topic} through guided questions.
        </p>
        <Button onClick={() => { setCurrentStepIndex(0); setHasSubmitted(false); setInputValue(''); }} variant="outline">
          Review Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 overflow-hidden flex flex-col min-h-[400px]">
      {/* Header */}
      <div className="bg-brand-purple/5 p-4 border-b border-brand-purple/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-purple">
          <HelpCircle className="w-5 h-5" />
          <h3 className="font-semibold">Socratic Exploration</h3>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Question {currentStepIndex + 1} of {steps.length}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Question */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">{currentStep.question}</h4>
          
          {!hasSubmitted && (
            <AnimatePresence>
              {showHint && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4 flex gap-2"
                >
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{currentStep.hint}</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Answer Area */}
        <div className="flex-1">
          {!hasSubmitted ? (
            <div className="space-y-4">
              <Textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[120px] resize-none border-gray-300 focus-visible:ring-brand-purple"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-amber-600"
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Need a hint?
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!inputValue.trim()}
                  className="bg-brand-purple hover:bg-brand-purple/90 text-white"
                >
                  Submit Answer <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Your Answer</div>
                <p className="text-gray-800">{inputValue}</p>
              </div>
              
              <div className={cn(
                "rounded-lg p-5 border",
                isCorrect ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    isCorrect ? "bg-green-200 text-green-700" : "bg-blue-200 text-blue-700"
                  )}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={cn(
                      "font-semibold mb-1",
                      isCorrect ? "text-green-800" : "text-blue-800"
                    )}>
                      {isCorrect ? "Good thinking!" : "Here's the breakdown:"}
                    </h5>
                    <p className={cn(
                      "text-sm",
                      isCorrect ? "text-green-700" : "text-blue-700"
                    )}>
                      {currentStep.explanation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleNext} className="bg-brand-purple hover:bg-brand-purple/90 text-white">
                  Next Question <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocraticMode;
