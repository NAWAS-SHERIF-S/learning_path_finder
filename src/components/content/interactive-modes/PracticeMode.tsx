import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PracticeModeProps {
  topic: string;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ topic }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Fallback mock questions based on the topic
  const questions: Question[] = [
    {
      id: 1,
      text: `Which of the following best describes the primary goal of automating a ${topic} workflow?`,
      options: [
        'To make the code as complex as possible',
        'To reduce manual, repetitive tasks and minimize human error',
        'To avoid using any external libraries',
        'To ensure the process takes longer to execute'
      ],
      correctIndex: 1,
      explanation: 'Automation is all about efficiency. By writing scripts to handle repetitive tasks, you save time and prevent manual data-entry errors.'
    },
    {
      id: 2,
      text: 'In a typical data automation pipeline, what usually happens immediately after the data is extracted (Input)?',
      options: [
        'It is immediately exported as a PDF',
        'It is deleted to save memory',
        'It is transformed and cleaned to ensure consistency',
        'It is sent to a printer'
      ],
      correctIndex: 2,
      explanation: 'Raw data is rarely perfect. Transformation (cleaning, filtering, formatting) is the crucial step before the data can be analyzed or exported.'
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const isFinished = currentQuestionIndex >= questions.length;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    setHasSubmitted(true);
    if (selectedOption === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setScore(0);
  };

  if (isFinished) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-brand-purple" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-2">Practice Complete!</h3>
        <p className="text-gray-600 mb-8 text-lg">
          You scored <span className="font-bold text-brand-purple">{score}</span> out of {questions.length}.
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
          <p className="text-gray-700">
            {score === questions.length 
              ? `Perfect score! You have a solid grasp of ${topic}.` 
              : `Good effort. Review the explanations to strengthen your understanding of ${topic}.`}
          </p>
        </div>

        <Button onClick={handleRestart} className="bg-brand-purple hover:bg-brand-purple/90 text-white px-8 py-6 text-lg rounded-xl">
          <RotateCcw className="w-5 h-5 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.correctIndex;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-purple/20 overflow-hidden max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-purple font-medium">
          <Target className="w-5 h-5" />
          Active Practice
        </div>
        <div className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <h4 className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
          {currentQuestion.text}
        </h4>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === currentQuestion.correctIndex;
            
            let optionStyle = "border-gray-200 hover:border-brand-purple/40 hover:bg-brand-purple/5 text-gray-700";
            
            if (hasSubmitted) {
              if (isCorrectOption) {
                optionStyle = "border-green-500 bg-green-50 text-green-800 font-medium";
              } else if (isSelected && !isCorrectOption) {
                optionStyle = "border-red-300 bg-red-50 text-red-800 opacity-70";
              } else {
                optionStyle = "border-gray-100 bg-gray-50 opacity-50";
              }
            } else if (isSelected) {
              optionStyle = "border-brand-purple ring-1 ring-brand-purple bg-brand-purple/5 text-brand-purple font-medium";
            }

            return (
              <button
                key={index}
                onClick={() => !hasSubmitted && setSelectedOption(index)}
                disabled={hasSubmitted}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3",
                  optionStyle,
                  !hasSubmitted && "cursor-pointer"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  hasSubmitted && isCorrectOption ? "border-green-500 bg-green-500 text-white" : 
                  hasSubmitted && isSelected && !isCorrectOption ? "border-red-500 bg-red-500 text-white" :
                  isSelected ? "border-brand-purple bg-brand-purple text-white" : "border-gray-300"
                )}>
                  {hasSubmitted && isCorrectOption ? <CheckCircle2 className="w-4 h-4" /> : 
                   hasSubmitted && isSelected && !isCorrectOption ? <XCircle className="w-4 h-4" /> : 
                   <span className="text-xs font-bold">{String.fromCharCode(65 + index)}</span>}
                </div>
                <span className="leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {hasSubmitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl p-5 border mb-6",
              isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}
          >
            <h5 className={cn(
              "font-bold mb-2 flex items-center gap-2",
              isCorrect ? "text-green-800" : "text-red-800"
            )}>
              {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {isCorrect ? "Correct!" : "Incorrect"}
            </h5>
            <p className={cn("text-sm leading-relaxed", isCorrect ? "text-green-700" : "text-red-700")}>
              {currentQuestion.explanation}
            </p>
          </motion.div>
        ) : null}

        <div className="flex justify-end border-t border-gray-100 pt-6">
          {!hasSubmitted ? (
            <Button 
              onClick={handleSubmit} 
              disabled={selectedOption === null}
              className="bg-brand-purple hover:bg-brand-purple/90 text-white px-8"
              size="lg"
            >
              Check Answer
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8"
              size="lg"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Practice' : 'Next Question'} 
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeMode;
