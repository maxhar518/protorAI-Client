import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Proctor from "@/components/Proctor";
import { ProctoringState, ProctoringActions } from "@/hooks/useProctoring";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface QuizData {
  parsedText: Question[];
}

const Quiz = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [proctoringState, setProctoringState] = useState<ProctoringState | null>(null);
  const [proctoringActions, setProctoringActions] = useState<ProctoringActions | null>(null);
  const { toast } = useToast();

  const handleProctoringReady = useCallback((state: ProctoringState, actions: ProctoringActions) => {
    setProctoringState(state);
    setProctoringActions(actions);
  }, []);

  const fetchQuizData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/exam", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "UnAuthorized",
            description: "Please Login first.",
            variant: "destructive",
          });
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setQuizData(data);
        toast({
          title: "Quiz Started",
          description: data.message || "Best of luck",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load quiz data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.parsedText.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizData || !proctoringState || !proctoringActions) return;

    const totalViolations = proctoringState.totalViolations;

    if (totalViolations >= 3) {
      toast({
        title: "Submission Blocked",
        description: "Quiz cannot be submitted due to multiple proctoring violations (tab switching/fullscreen exits).",
        variant: "destructive",
      });
      await proctoringActions.exportViolationLog();
      return;
    }

    if (proctoringState.permissionViolated) {
      toast({
        title: "Submission Blocked",
        description: "Quiz cannot be submitted due to permission violations during the exam.",
        variant: "destructive",
      });
      await proctoringActions.exportViolationLog();
      return;
    }

    if (!proctoringState.permissionsGranted) {
      toast({
        title: "Submission Blocked",
        description: "Camera and microphone must be active to submit the quiz.",
        variant: "destructive",
      });
      return;
    }

    let correctAnswers = 0;
    quizData.parsedText.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) correctAnswers++;
    });

    const calculatedScore = (correctAnswers / quizData.parsedText.length) * 100;
    setScore(calculatedScore);
    setIsSubmitted(true);

    proctoringActions.cleanupMedia();

    // Exit fullscreen on submit
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Export violation log to backend
    await proctoringActions.exportViolationLog(calculatedScore);

    toast({
      title: "Quiz Submitted!",
      description: `You scored ${correctAnswers}/${quizData.parsedText.length} (${calculatedScore.toFixed(1)}%)`,
    });
  };

  const getAnswerFeedback = (questionIndex: number) => {
    if (!isSubmitted || !quizData) return null;

    const q = quizData.parsedText[questionIndex];
    const selectedAnswer = selectedAnswers[questionIndex];
    const isCorrect = selectedAnswer === q.answer;

    return (
      <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        <span className="font-medium">
          {isCorrect ? "Correct!" : `Incorrect. Correct answer: ${q.answer}`}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">Loading quiz...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizData?.parsedText?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No quiz available</p>
        <br />
        <Button onClick={fetchQuizData}>Retry</Button>
      </div>
    );
  }

  const currentQuestion = quizData.parsedText[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.parsedText.length) * 100;
  const allAnswersSelected = quizData.parsedText.every((_, i) => selectedAnswers[i]);
  const totalViolations = proctoringState?.totalViolations ?? 0;

  return (
    <Proctor
      isSubmitted={isSubmitted}
      currentQuestionIndex={currentQuestionIndex}
      onProctoringReady={handleProctoringReady}
    >
      <Card className="justify-between items-center">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="text-right">{currentQuestion?.question}</span>
            <span>{progress / 10}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="select-none">
            <RadioGroup
              value={selectedAnswers[currentQuestionIndex] || ""}
              onValueChange={handleAnswerSelect}
              disabled={isSubmitted}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 select-none">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="select-none">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          {getAnswerFeedback(currentQuestionIndex)}

          <div className="flex justify-between mt-6">
            <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <div className="flex gap-2">
              {currentQuestionIndex === quizData.parsedText.length - 1 && !isSubmitted ? (
                totalViolations >= 3 ? (
                  <Button disabled className="bg-red-500 hover:bg-red-500">
                    Submission Blocked - Integrity Violations
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!allAnswersSelected}>
                    Submit Quiz
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === quizData.parsedText.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isSubmitted && score !== null && (
        <Card className="mt-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Quiz Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="font-bold">{score.toFixed(1)}%</div> <br />
              <Link to="/">
                <Button>Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </Proctor>
  );
};

export default Quiz;
