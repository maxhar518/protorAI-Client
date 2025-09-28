import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, XCircle } from "lucide-react";
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

  useEffect(() => {
    fetchQuizData();
  }, []);

  const fetchQuizData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3000/api/quiz");
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setQuizData(data);
    } catch (error) {
      console.error("Failed to fetch quiz data:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.parsedText.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!quizData) return;

    let correctAnswers = 0;
    quizData.parsedText.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });

    const calculatedScore = (correctAnswers / quizData.parsedText.length) * 100;
    setScore(calculatedScore);
    setIsSubmitted(true);

    toast({
      title: "Quiz Submitted!",
      description: `You scored ${correctAnswers}/${quizData.parsedText.length} (${calculatedScore.toFixed(1)}%)`,
    });
  };

  const getAnswerFeedback = (questionIndex: number) => {
    if (!isSubmitted || !quizData) return null;
    
    const question = quizData.parsedText[questionIndex];
    const selectedAnswer = selectedAnswers[questionIndex];
    const isCorrect = selectedAnswer === question.answer;

    return (
      <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isCorrect ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
        <span className="font-medium">
          {isCorrect ? 'Correct!' : `Incorrect. Correct answer: ${question.answer}`}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <h2 className="text-xl font-semibold mb-2">Loading Quiz...</h2>
              <p className="text-muted-foreground">Please wait while we fetch your quiz.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizData || !quizData.parsedText || quizData.parsedText.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">No Quiz Available</h2>
              <p className="text-muted-foreground">No quiz data found. Please try again later.</p>
              <Button onClick={fetchQuizData} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizData.parsedText[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.parsedText.length) * 100;
  const allAnswersSelected = quizData.parsedText.every((_, index) => selectedAnswers[index]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quiz Assessment</h1>
              <p className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {quizData.parsedText.length}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question}
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
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${index}`}
                    className={isSubmitted && option === currentQuestion.answer ? 'border-green-500' : ''}
                  />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className={`cursor-pointer ${
                      isSubmitted && option === currentQuestion.answer 
                        ? 'text-green-600 font-medium' 
                        : ''
                    }`}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Answer Feedback */}
            {getAnswerFeedback(currentQuestionIndex)}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex === quizData.parsedText.length - 1 && !isSubmitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allAnswersSelected}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === quizData.parsedText.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Display */}
        {isSubmitted && score !== null && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
                <div className={`text-4xl font-bold mb-2 ${
                  score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {score.toFixed(1)}%
                </div>
                <p className="text-muted-foreground">
                  You got {Object.values(selectedAnswers).filter((answer, index) => 
                    answer === quizData.parsedText[index].answer
                  ).length} out of {quizData.parsedText.length} questions correct.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Quiz;