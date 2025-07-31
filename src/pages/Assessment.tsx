import { useState } from "react";
import { WelcomePage } from "@/components/WelcomePage";
import { UserInfoForm, UserInfo } from "@/components/UserInfoForm";
import { QuestionnaireForm, QuestionnaireData, AssessmentAnswers } from "@/components/QuestionnaireForm";
import { ResultsPage, AssessmentResults, CategoryScore } from "@/components/ResultsPage";
import { useToast } from "@/hooks/use-toast";

// Sample questionnaire data - this would come from your backend/database
const sampleQuestionnaire: QuestionnaireData = {
  categories: {
    "Social Skills": {
      name: "Social Skills",
      questions: [
        { id: "ss1", text: "I find it easy to start conversations with new people", category: "Social Skills" },
        { id: "ss2", text: "I can effectively communicate my ideas to others", category: "Social Skills" },
        { id: "ss3", text: "I am comfortable speaking in group settings", category: "Social Skills" },
        { id: "ss4", text: "I can read non-verbal cues from others accurately", category: "Social Skills" },
      ]
    },
    "Self Awareness": {
      name: "Self Awareness",
      questions: [
        { id: "sa1", text: "I understand my emotional triggers and reactions", category: "Self Awareness" },
        { id: "sa2", text: "I am aware of my strengths and weaknesses", category: "Self Awareness" },
        { id: "sa3", text: "I recognize how my emotions affect my behavior", category: "Self Awareness" },
        { id: "sa4", text: "I can accurately assess my own performance", category: "Self Awareness" },
      ]
    },
    "Motivating Self": {
      name: "Motivating Self",
      questions: [
        { id: "ms1", text: "I can maintain motivation even when facing obstacles", category: "Motivating Self" },
        { id: "ms2", text: "I set challenging but achievable goals for myself", category: "Motivating Self" },
        { id: "ms3", text: "I persist through difficult tasks until completion", category: "Motivating Self" },
        { id: "ms4", text: "I take initiative to improve my skills and knowledge", category: "Motivating Self" },
      ]
    },
    "Empathy": {
      name: "Empathy",
      questions: [
        { id: "em1", text: "I can easily understand how others are feeling", category: "Empathy" },
        { id: "em2", text: "I consider others' perspectives before making decisions", category: "Empathy" },
        { id: "em3", text: "I respond appropriately to others' emotional needs", category: "Empathy" },
        { id: "em4", text: "I can sense tension or conflict in group situations", category: "Empathy" },
      ]
    },
    "Self Regulation": {
      name: "Self Regulation",
      questions: [
        { id: "sr1", text: "I can control my emotions in stressful situations", category: "Self Regulation" },
        { id: "sr2", text: "I think before I act, especially when upset", category: "Self Regulation" },
        { id: "sr3", text: "I can adapt quickly to changing circumstances", category: "Self Regulation" },
        { id: "sr4", text: "I manage my time and priorities effectively", category: "Self Regulation" },
      ]
    }
  }
};

export type AssessmentStep = "welcome" | "userInfo" | "questionnaire" | "results";

const Assessment = () => {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("welcome");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const { toast } = useToast();

  const calculateResults = (userInfo: UserInfo, answers: AssessmentAnswers): AssessmentResults => {
    const categoryColors = {
      "Social Skills": "#3b82f6",
      "Self Awareness": "#8b5cf6", 
      "Motivating Self": "#f59e0b",
      "Empathy": "#ec4899",
      "Self Regulation": "#10b981"
    };

    const scores: CategoryScore[] = Object.entries(sampleQuestionnaire.categories).map(([categoryName, category]) => {
      const categoryAnswers = category.questions.map(q => answers[q.id] || 0);
      const totalScore = categoryAnswers.reduce((sum, score) => sum + score, 0);
      const maxScore = category.questions.length * 5;
      const percentage = Math.round((totalScore / maxScore) * 100);
      
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
        color: categoryColors[categoryName as keyof typeof categoryColors]
      };
    });

    const overallScore = Math.round(
      scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length
    );

    return {
      userInfo,
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

  const handleQuestionnaireComplete = (assessmentAnswers: AssessmentAnswers) => {
    setAnswers(assessmentAnswers);
    if (userInfo) {
      const calculatedResults = calculateResults(userInfo, assessmentAnswers);
      setResults(calculatedResults);
      setCurrentStep("results");
      
      toast({
        title: "Assessment Complete!",
        description: "Your personalized report has been generated.",
      });
    }
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

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Generation",
      description: "PDF download feature will be implemented with backend integration.",
    });
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
      return (
        <QuestionnaireForm
          questionnaire={sampleQuestionnaire}
          onComplete={handleQuestionnaireComplete}
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