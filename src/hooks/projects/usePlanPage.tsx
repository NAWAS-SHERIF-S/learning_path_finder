
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateLearningPlan } from "@/utils/learning";
import { deleteLearningPath } from "@/utils/projectUtils";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/learning/LearningStep";
import { startBackgroundContentGeneration } from "@/utils/learning/backgroundContentGeneration";

export const usePlanPage = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [pathId, setPathId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const topicFromUrl = searchParams.get("topic");
    const storedTopic = topicFromUrl || sessionStorage.getItem("learn-topic");

    if (!storedTopic) {
      navigate("/");
      return;
    }

    setTopic(storedTopic);
    sessionStorage.setItem("learn-topic", storedTopic);

    const checkAuthAndFetchPlan = async () => {
      setLoading(true);
      setAuthError(false);

      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;
      setUser(currentUser);

      if (!currentUser) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      try {
        const plan = await generateLearningPlan(storedTopic);
        setSteps(plan);

        if (plan.length > 0) {
          const storedPathId = sessionStorage.getItem("learning-path-id");
          if (storedPathId) {
            setPathId(storedPathId);
          } else {
            const { data: stepData } = await supabase
              .from('learning_steps')
              .select('path_id')
              .eq('id', plan[0].id)
              .maybeSingle();

            if (stepData && stepData.path_id) {
              setPathId(stepData.path_id);
            } else {
              setPathId(`path-${Date.now()}`);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "User is not authenticated") {
          setAuthError(true);
        } else {
          console.error("Error generating plan:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchPlan();
  }, [navigate]);

  const handleApprove = async () => {
    if (!pathId || !topic) {
      console.error("No learning path found. Please try again.");
      return;
    }

    if (steps.length === 0) {
      console.error("No steps found in the plan. Please try again.");
      return;
    }

    try {
      // First, update the learning path to mark it as approved
      const { error } = await supabase
        .from('learning_paths')
        .update({ is_approved: true })
        .eq('id', pathId);

      if (error) {
        console.error("Error approving plan:", error);
        return;
      }

      // Store the path info in session storage for the content page
      sessionStorage.setItem("learning-path-id", pathId);

      console.log(`Starting content generation for ${steps.length} steps`);

      // Start background generation (fire-and-forget pattern is intentional)
      // ContentPage will monitor progress via useLearningSteps hook
      startBackgroundContentGeneration(steps, topic, pathId).catch((err) => {
        // Log any errors but don't block navigation - ContentPage handles retry
        console.error("Background generation error:", err);
      });

      // Navigate to content page which will show loading state while content generates
      navigate(`/content/${pathId}`);
    } catch (error) {
      console.error("Error in handleApprove:", error);
    }
  };

  const handleReset = () => {
    navigate("/");
    sessionStorage.removeItem("learn-topic");
    sessionStorage.removeItem("learning-path-id");
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleDeletePlan = async () => {
    if (!pathId) {
      console.error("No project ID found");
      return;
    }
    
    setIsDeleting(true);
    try {
      const success = await deleteLearningPath(pathId);
      if (success) {
        navigate("/projects");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    topic,
    steps,
    loading,
    authError,
    activeStep,
    pathId,
    isDeleting,
    setActiveStep,
    handleApprove,
    handleReset,
    handleLogin,
    handleDeletePlan
  };
};
