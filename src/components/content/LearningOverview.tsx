import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, PlayCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type LearningStepData } from "@/hooks/learning-steps";

interface LearningOverviewProps {
  topic: string;
  steps: LearningStepData[];
  pathId: string;
  navigateToStep: (index: number) => void;
  goToProjects: () => void;
}

const LearningOverview = ({
  topic,
  steps,
  pathId,
  navigateToStep,
  goToProjects
}: LearningOverviewProps) => {
  const totalSteps = steps.length;
  // Calculate progress based on is_completed status
  const completedSteps = steps.filter(step => step.is_completed).length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] to-white relative pb-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-br from-[#6654f5]/5 via-[#ca5a8b]/5 to-transparent rounded-b-full blur-3xl opacity-70" />
      </div>

      <div className="relative max-w-4xl mx-auto pt-16 px-6 sm:px-8 z-10">
        <button
          onClick={goToProjects}
          className="mb-8 text-sm font-medium text-gray-500 hover:text-brand-purple flex items-center transition-colors"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to Projects
        </button>

        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#6654f5] via-[#ca5a8b] to-[#f2b347] bg-clip-text text-transparent mb-4 leading-tight">
            {topic}
          </h1>
          <p className="text-gray-600 text-lg md:text-xl font-light mb-8 max-w-2xl">
            Your personalized learning journey is ready. Follow these modules to master the topic step by step.
          </p>

          {/* Global Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-800">Overall Progress</span>
              <span className="text-brand-purple font-bold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 rounded-full bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-[#6654f5] [&>div]:to-[#ca5a8b]" />
            <div className="mt-3 text-sm text-gray-500 font-medium">
              {completedSteps} of {totalSteps} modules complete
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = !!step.is_completed;
            const isUnlocked = true; // For now, all modules can be accessed, or strict unlocking could be enforced

            return (
              <motion.div
                key={step.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className={`overflow-hidden border-2 transition-all duration-300 ${
                  isCompleted ? 'border-green-100 bg-green-50/10' : 
                  isUnlocked ? 'border-brand-purple/20 hover:border-brand-purple/40 hover:shadow-md' : 
                  'border-gray-100 bg-gray-50 opacity-70'
                }`}>
                  <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-purple/10 text-brand-purple">
                          Module {index + 1}
                        </span>
                        {isCompleted && (
                          <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {step.description || "Dive deep into the concepts, practical applications, and best practices for this module."}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          ~15 mins
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
                          Interactive content
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex-shrink-0 mt-4 md:mt-0">
                      <Button 
                        onClick={() => navigateToStep(index)}
                        disabled={!isUnlocked}
                        className={`w-full md:w-auto rounded-full px-8 py-6 font-bold text-sm shadow-sm transition-all ${
                          isCompleted 
                            ? 'bg-white border-2 border-brand-purple text-brand-purple hover:bg-brand-purple/5' 
                            : 'bg-gradient-to-r from-[#6654f5] to-[#ca5a8b] hover:shadow-md text-white border-0'
                        }`}
                      >
                        {isCompleted ? 'Review Module' : (completedSteps > 0 && !isCompleted && index > 0 ? 'Continue' : 'Start Module')}
                        {!isCompleted && <PlayCircle className="w-5 h-5 ml-2" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningOverview;
