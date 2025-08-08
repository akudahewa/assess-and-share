import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AnswerOption {
  text: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  options?: AnswerOption[];
}

export interface QuestionnaireData {
  title?: string;
  categories: {
    [key: string]: {
      name: string;
      questions: Question[];
    };
  };
}

export interface AssessmentAnswers {
  [questionId: string]: number;
}

interface QuestionnaireFormProps {
  questionnaire: QuestionnaireData;
  onComplete: (answers: AssessmentAnswers) => void;
  onBack: () => void;
}

export const QuestionnaireForm = ({ questionnaire, onComplete, onBack }: QuestionnaireFormProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});

  // Flatten all questions across categories
  const allQuestions = Object.values(questionnaire.categories).flatMap(category =>
    category.questions
  );

  // Handle case where there are no questions
  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-variant">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
            <p className="text-muted-foreground mb-8">
              This questionnaire doesn't have any questions yet. Please contact an administrator.
            </p>
            <Button onClick={onBack}>Back to Welcome</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;

  const handleAnswer = (optionIndex: string) => {
    const selectedOption = currentQuestion.options?.[parseInt(optionIndex)];
    if (selectedOption) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: selectedOption.score
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const canProceed = answers[currentQuestion.id] !== undefined;
  const isLastQuestion = currentQuestionIndex === allQuestions.length - 1;

  const getSelectedOptionIndex = () => {
    const currentScore = answers[currentQuestion.id];
    if (currentScore === undefined) return "";
    return currentQuestion.options?.findIndex(opt => opt.score === currentScore)?.toString() || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-variant">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Welcome
              </Button>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {allQuestions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-8 shadow-soft border-border">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-soft text-primary">
                  {currentQuestion.category}
                </span>
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={getSelectedOptionIndex()}
                onValueChange={handleAnswer}
                className="space-y-4"
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      className="border-2"
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground">({option.score})</span>
                      </div>
                    </Label>
                  </div>
                )) || []}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              variant="default"
              className="flex items-center gap-2"
            >
              {isLastQuestion ? "Complete Assessment" : "Next"}
              {!isLastQuestion && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: Math.ceil(allQuestions.length / 5) }).map((_, index) => {
                const start = index * 5;
                const end = Math.min(start + 5, allQuestions.length);
                const isActive = currentQuestionIndex >= start && currentQuestionIndex < end;
                const isCompleted = currentQuestionIndex >= end;
                
                return (
                  <div
                    key={index}
                    className={`w-8 h-2 rounded-full transition-colors ${
                      isCompleted
                        ? "bg-success"
                        : isActive
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};