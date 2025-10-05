import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Shield, Camera, Mic, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface QuizData {
  parsedText: Question[];
}

interface ViolationLog {
  type: 'tab-switch' | 'fullscreen-exit';
  timestamp: string;
}

const Quiz = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [permissionViolated, setPermissionViolated] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationLog, setViolationLog] = useState<ViolationLog[]>([]);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMedia = async () => {
    try {
      setPermissionsLoading(true);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        setBrowserSupported(false);
        setShowPermissionWarning(true);
        setPermissionsGranted(false);
        setPermissionsLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (audioRef.current) audioRef.current.srcObject = stream;

      setPermissionsGranted(true);
      setShowPermissionWarning(false);
      setPermissionsLoading(false);

      const validateTracks = () => {
        if (!streamRef.current) {
          setPermissionsGranted(false);
          setShowPermissionWarning(true);
          if (!isSubmitted) setPermissionViolated(true);
          return;
        }

        const videoTracks = streamRef.current.getVideoTracks();
        const audioTracks = streamRef.current.getAudioTracks();
        
        const videoEnabled = videoTracks.some((t) => t.enabled && t.readyState === 'live');
        const audioEnabled = audioTracks.some((t) => t.enabled && t.readyState === 'live');
        
        const bothEnabled = videoEnabled && audioEnabled;
        setPermissionsGranted(bothEnabled);
        setShowPermissionWarning(!bothEnabled);
        
        if (!bothEnabled && !isSubmitted) {
          setPermissionViolated(true);
        }
      };

      validateTracks();
      intervalRef.current = setInterval(validateTracks, 2000);
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setPermissionsGranted(false);
      setShowPermissionWarning(true);
      setPermissionsLoading(false);
      setPermissionViolated(true);
      
      toast({
        title: "Permission Denied",
        description: "Camera and microphone access are required for the quiz.",
        variant: "destructive",
      });
    }
  };

  const cleanupMedia = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

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

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted && permissionsGranted) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          const totalViolations = newCount + fullscreenExitCount;
          
          setViolationLog((logs) => [...logs, {
            type: 'tab-switch',
            timestamp: new Date().toISOString()
          }]);

          if (newCount === 1) {
            toast({
              title: "⚠️ Warning",
              description: "Tab switching detected - 1st violation",
              variant: "destructive",
            });
          } else if (newCount === 2) {
            toast({
              title: "⚠️ Warning",
              description: "Tab switching detected - 2nd violation. One more will invalidate your exam",
              variant: "destructive",
            });
          } else if (totalViolations >= 3) {
            toast({
              title: "⚠️ Exam Invalidated",
              description: "Quiz submission blocked due to multiple violations",
              variant: "destructive",
            });
          }
          
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmitted, permissionsGranted, fullscreenExitCount]);

  // Fullscreen enforcement
  useEffect(() => {
    const enterFullscreen = async () => {
      if (!permissionsGranted || isSubmitted) return;
      
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          setShowFullscreenWarning(false);
        }
      } catch (error) {
        console.error("Error entering fullscreen:", error);
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !isSubmitted && permissionsGranted) {
        setShowFullscreenWarning(true);
        
        setFullscreenExitCount((prev) => {
          const newCount = prev + 1;
          const totalViolations = tabSwitchCount + newCount;
          
          setViolationLog((logs) => [...logs, {
            type: 'fullscreen-exit',
            timestamp: new Date().toISOString()
          }]);

          if (newCount === 1) {
            toast({
              title: "⚠️ Warning",
              description: "Fullscreen mode exited - 1st violation",
              variant: "destructive",
            });
          } else if (newCount === 2) {
            toast({
              title: "⚠️ Warning",
              description: "Fullscreen mode exited - 2nd violation. One more will invalidate your exam",
              variant: "destructive",
            });
          } else if (totalViolations >= 3) {
            toast({
              title: "⚠️ Exam Invalidated",
              description: "Quiz submission blocked due to multiple violations",
              variant: "destructive",
            });
          }
          
          return newCount;
        });
      }
    };

    if (permissionsGranted && !isSubmitted) {
      enterFullscreen();
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [permissionsGranted, isSubmitted, tabSwitchCount]);

  // Copy/Paste prevention
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Copy/paste is disabled during the exam",
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Copy/paste is disabled during the exam",
      });
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Cut is disabled during the exam",
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        description: "ℹ️ Right-click is disabled during the exam",
      });
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    fetchQuizData();
    startMedia();
    return () => cleanupMedia();
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

  const handleSubmit = () => {
    if (!quizData) return;
    
    const totalViolations = tabSwitchCount + fullscreenExitCount;
    
    if (totalViolations >= 3) {
      toast({
        title: "Submission Blocked",
        description: "Quiz cannot be submitted due to multiple proctoring violations (tab switching/fullscreen exits).",
        variant: "destructive",
      });
      return;
    }
    
    if (permissionViolated) {
      toast({
        title: "Submission Blocked",
        description: "Quiz cannot be submitted due to permission violations during the exam.",
        variant: "destructive",
      });
      return;
    }

    if (!permissionsGranted) {
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

    cleanupMedia();
    
    // Exit fullscreen on submit
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }

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
      <div
        className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
      >
        {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        <span className="font-medium">
          {isCorrect ? "Correct!" : `Incorrect. Correct answer: ${q.answer}`}
        </span>
      </div>
    );
  };

  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">
                {permissionsLoading ? "Requesting camera and microphone access..." : "Loading quiz..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizData?.parsedText?.length) {
    return (
      <div>
        <p>No quiz available</p>
        <Button onClick={fetchQuizData}>Retry</Button>
      </div>
    );
  }

  const currentQuestion = quizData.parsedText[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.parsedText.length) * 100;
  const allAnswersSelected = quizData.parsedText.every((_, i) => selectedAnswers[i]);
  const totalViolations = tabSwitchCount + fullscreenExitCount;
  
  const getViolationColor = () => {
    if (totalViolations === 0) return "text-green-600";
    if (totalViolations < 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen relative">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <audio ref={audioRef} autoPlay muted className="hidden" />

      {/* Permission Warning Overlay */}
      {showPermissionWarning && !showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-2 border-destructive/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Access Required
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {!browserSupported 
                  ? "Your browser doesn't support camera and microphone access."
                  : "Camera and microphone access are required for exam integrity and proctoring."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription className="flex items-start gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">Camera Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      <span className="font-medium">Microphone Access</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              {permissionViolated && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ Permission violation detected. Your quiz attempt may be invalidated.
                  </AlertDescription>
                </Alert>
              )}

              {browserSupported && (
                <Button 
                  onClick={startMedia} 
                  className="w-full bg-destructive hover:bg-destructive/90"
                  size="lg"
                >
                  Grant Permissions
                </Button>
              )}
              
              {!browserSupported && (
                <p className="text-sm text-muted-foreground text-center">
                  Please use a modern browser (Chrome, Firefox, Safari, or Edge) to take this quiz.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fullscreen Warning Overlay */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-2 border-yellow-500/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-yellow-600">
                Fullscreen Required
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Fullscreen mode is required for exam integrity. Please re-enter fullscreen to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertDescription className="text-yellow-800">
                  ⚠️ Exiting fullscreen is counted as a violation. {3 - totalViolations} warnings remaining.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={async () => {
                  try {
                    await document.documentElement.requestFullscreen();
                    setShowFullscreenWarning(false);
                  } catch (error) {
                    console.error("Error entering fullscreen:", error);
                  }
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                size="lg"
              >
                Re-enter Fullscreen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Content with Blur */}
      <div className={`transition-all duration-300 ${!permissionsGranted || showFullscreenWarning ? "blur-lg pointer-events-none" : ""}`}>

      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-right">{currentQuestion?.question}</span>
              <span>{progress / 10}</span>
            </CardTitle>
            {totalViolations > 0 && (
              <div className="mt-2">
                <Alert className={`border-2 ${totalViolations >= 3 ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <AlertTriangle className={`h-4 w-4 ${getViolationColor()}`} />
                  <AlertDescription className={`${getViolationColor()} font-semibold`}>
                    ⚠️ Proctoring Violations: {totalViolations}/3
                    {totalViolations >= 3 && " - Submission Blocked"}
                  </AlertDescription>
                </Alert>
              </div>
            )}
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
              <Link to="/">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-primary rounded-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
              </Link>
              <CardTitle className="text-2xl font-bold">Quiz Completed</CardTitle>
              <CardContent>
                <div className="text-center">
                  <div>{score.toFixed(1)}%</div>
                  <Button>Home</Button>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
};

export default Quiz;