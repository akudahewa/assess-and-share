import { useState, useEffect } from "react";
import { WelcomePage } from "@/components/WelcomePage";
import { UserInfoForm, UserInfo } from "@/components/UserInfoForm";
import { QuestionnaireForm, QuestionnaireData, AssessmentAnswers, AnswerOption } from "@/components/QuestionnaireForm";
import { ResultsPage, AssessmentResults, CategoryScore } from "@/components/ResultsPage";
import { useToast } from "@/hooks/use-toast";
import { questionnairesApi, questionsApi, userResponsesApi } from "@/lib/api";
import { generatePDFReport } from "@/lib/pdfGenerator";

interface DatabaseQuestion {
  id: string;
  text: string;
  options: AnswerOption[];
  categories: { name: string };
}

export type AssessmentStep = "welcome" | "userInfo" | "questionnaire" | "results";

const Assessment = () => {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("welcome");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestionnaire();
  }, []);

  const loadQuestionnaire = async () => {
    setLoading(true);
    try {
      // Get the first active questionnaire
      const questionnairesResponse = await questionnairesApi.getActive();
      const questionnaires = questionnairesResponse.data as any[];

      if (!questionnaires || questionnaires.length === 0) {
        toast({
          title: "Error",
          description: "No active questionnaires found",
          variant: "destructive",
        });
        return;
      }

      // Get questions for this questionnaire with their categories
      const questionsResponse = await questionsApi.getByQuestionnaire(questionnaires[0].id);
      const questions = questionsResponse.data as any[];

      // Transform data into required format
      const questionnaireData: QuestionnaireData = {
        title: questionnaires[0].title,
        categories: {}
      };

      questions?.forEach((q: any) => {
        const categoryName = q.categoryId?.name || 'Uncategorized';
        if (!questionnaireData.categories[categoryName]) {
          questionnaireData.categories[categoryName] = {
            name: categoryName,
            questions: []
          };
        }
        questionnaireData.categories[categoryName].questions.push({
          id: q.id,
          text: q.text,
          category: categoryName,
          options: q.options as AnswerOption[]
        });
      });

      setQuestionnaire(questionnaireData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = (userInfo: UserInfo, answers: AssessmentAnswers): AssessmentResults => {
    if (!questionnaire) return { userInfo, scores: [], overallScore: 0, reflections: {} };

    // Dynamic category colors - generate colors for each category
    const categoryColors: { [key: string]: string } = {};
    const colorPalette = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#10b981", "#ef4444", "#06b6d4", "#84cc16"];
    Object.keys(questionnaire.categories).forEach((categoryName, index) => {
      categoryColors[categoryName] = colorPalette[index % colorPalette.length];
    });

    const scores: CategoryScore[] = Object.entries(questionnaire.categories).map(([categoryName, category]) => {
      const categoryAnswers = category.questions.map(q => answers[q.id] || 0);
      const totalScore = categoryAnswers.reduce((sum, score) => sum + score, 0);
      
      // Calculate max score based on actual options
      const maxScore = category.questions.reduce((sum, question) => {
        const maxOptionScore = Math.max(...(question.options?.map(opt => opt.score) || [0]));
        return sum + maxOptionScore;
      }, 0);
      
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      
      let level: "High" | "Medium" | "Low";
      if (percentage >= 75) level = "High";
      else if (percentage >= 50) level = "Medium";
      else level = "Low";

      return {
        category: categoryName,
        score: totalScore,
        maxScore,
        percentage,
        level,
        color: categoryColors[categoryName as keyof typeof categoryColors] || "#6b7280"
      };
    });

    const overallScore = Math.round(
      scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length
    );

    return {
      userInfo,
      questionnaireName: questionnaire.title || "Assessment",
      scores,
      overallScore,
      reflections: {} // Would be populated with user reflections
    };
  };

  const handleStartAssessment = () => {
    setCurrentStep("userInfo");
  };

  const handleUserInfoSubmit = (info: UserInfo) => {
    setUserInfo(info);
    setCurrentStep("questionnaire");
  };

  const handleQuestionnaireComplete = async (assessmentAnswers: AssessmentAnswers, timeSpent: number) => {
    setAnswers(assessmentAnswers);
    
    if (userInfo) {
      try {
        // Get the active questionnaire ID
        const questionnairesResponse = await questionnairesApi.getActive();
        const questionnaires = questionnairesResponse.data as any[];
        
        if (!questionnaires || questionnaires.length === 0) {
          throw new Error("No active questionnaire found");
        }

        const questionnaireId = questionnaires[0].id;
        
        // Save user response to database
        await userResponsesApi.create({
          questionnaireId: questionnaireId,
          userName: userInfo.name,
          userEmail: userInfo.email,
          responses: assessmentAnswers,
          timeSpent: timeSpent,
          status: 'completed'
        });

        // Calculate results for display
        const calculatedResults = calculateResults(userInfo, assessmentAnswers);
        setResults(calculatedResults);
        setCurrentStep("results");
        
        toast({
          title: "Assessment Complete!",
          description: "Your personalized report has been generated and saved.",
        });
      } catch (error: any) {
        console.error("Error saving response:", error);
        toast({
          title: "Warning",
          description: "Assessment completed but there was an issue saving your response. Your results are still available.",
          variant: "destructive",
        });
        
        // Still show results even if saving failed
        const calculatedResults = calculateResults(userInfo, assessmentAnswers);
        setResults(calculatedResults);
        setCurrentStep("results");
      }
    }
  };

  const handleQuestionnaireAbandon = async (assessmentAnswers: AssessmentAnswers, timeSpent: number) => {
    if (userInfo) {
      try {
        // Get the active questionnaire ID
        const questionnairesResponse = await questionnairesApi.getActive();
        const questionnaires = questionnairesResponse.data as any[];
        
        if (!questionnaires || questionnaires.length === 0) {
          throw new Error("No active questionnaire found");
        }

        const questionnaireId = questionnaires[0].id;
        
        // Save abandoned response to database
        await userResponsesApi.create({
          questionnaireId: questionnaireId,
          userName: userInfo.name,
          userEmail: userInfo.email,
          responses: assessmentAnswers,
          timeSpent: timeSpent,
          status: 'abandoned'
        });

        toast({
          title: "Assessment Saved",
          description: "Your partial responses have been saved.",
        });
      } catch (error: any) {
        console.error("Error saving abandoned response:", error);
        toast({
          title: "Warning",
          description: "There was an issue saving your partial responses.",
          variant: "destructive",
        });
      }
    }
    
    // Go back to user info form
    setCurrentStep("userInfo");
  };

  const handleRestart = () => {
    setCurrentStep("welcome");
    setUserInfo(null);
    setAnswers({});
    setResults(null);
  };

  const handleBackToWelcome = () => {
    setCurrentStep("welcome");
  };

  const handleBackToUserInfo = () => {
    setCurrentStep("userInfo");
  };

  const handleDownloadPDF = async () => {
    if (!results) {
      toast({
        title: "Error",
        description: "No results available to generate PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your report...",
      });

      await generatePDFReport(results);
      
      toast({
        title: "PDF Downloaded",
        description: "Your assessment report has been downloaded successfully!",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailReport = () => {
    toast({
      title: "Email Report",
      description: "Email functionality will be implemented with backend integration.",
    });
  };

  switch (currentStep) {
    case "welcome":
      return <WelcomePage onStartAssessment={handleStartAssessment} />;
    
    case "userInfo":
      return (
        <UserInfoForm 
          onSubmit={handleUserInfoSubmit}
          onBack={handleBackToWelcome}
        />
      );
    
    case "questionnaire":
      if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading questionnaire...</div>;
      }
      if (!questionnaire) {
        return <div className="min-h-screen flex items-center justify-center">No questionnaire available</div>;
      }
      return (
        <QuestionnaireForm
          questionnaire={questionnaire}
          onComplete={handleQuestionnaireComplete}
          onAbandon={handleQuestionnaireAbandon}
          onBack={handleBackToUserInfo}
        />
      );
    
    case "results":
      if (!results) return null;
      return (
        <ResultsPage
          results={results}
          onRestart={handleRestart}
          onDownloadPDF={handleDownloadPDF}
          onEmailReport={handleEmailReport}
        />
      );
    
    default:
      return <WelcomePage onStartAssessment={handleStartAssessment} />;
  }
};

export default Assessment;