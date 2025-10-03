import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Link, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [blur, setBlur] = useState(false);

  const startMedia = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;

        if (videoRef.current) videoRef.current.srcObject = stream;
        if (audioRef.current) audioRef.current.srcObject = stream;

        const validateTracks = () => {
          if (!streamRef.current) return;
          const videoEnabled = streamRef.current.getVideoTracks().some((t) => t.enabled);
          const audioEnabled = streamRef.current.getAudioTracks().some((t) => t.enabled);
          setBlur(!videoEnabled || !audioEnabled);
        };

        validateTracks();
        intervalRef.current = setInterval(validateTracks, 1000);
      } else {
        console.log("getUserMedia not supported");
        setBlur(true);
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setBlur(true);
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

    let correctAnswers = 0;
    quizData.parsedText.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) correctAnswers++;
    });

    const calculatedScore = (correctAnswers / quizData.parsedText.length) * 100;
    setScore(calculatedScore);
    setIsSubmitted(true);

    cleanupMedia();

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

  if (isLoading) {
    return <div>Loading quiz...</div>;
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

  return (
    <div className={`min-h-screen ${blur ? "blur-sm pointer-events-none" : ""}`}>
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <audio ref={audioRef} autoPlay className="hidden" />

      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-right">{currentQuestion?.question}</span>
              <span>{progress / 10}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedAnswers[currentQuestionIndex] || ""}
              onValueChange={handleAnswerSelect}
              disabled={isSubmitted}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {getAnswerFeedback(currentQuestionIndex)}

            <div className="flex justify-between mt-6">
              <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="flex gap-2">
                {currentQuestionIndex === quizData.parsedText.length - 1 && !isSubmitted ? (
                  <Button onClick={handleSubmit} disabled={!allAnswersSelected}>
                    Submit Quiz
                  </Button>
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
  );
};

export default Quiz;