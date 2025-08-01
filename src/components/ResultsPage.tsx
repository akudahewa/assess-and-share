import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Mail, RotateCcw, TrendingUp, Target, Lightbulb, Radar, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SpiralChart } from "./charts/SpiralChart";
import { RadarChart } from "./charts/RadarChart";

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: "High" | "Medium" | "Low";
  color: string;
}

export interface AssessmentResults {
  userInfo: {
    name: string;
    email: string;
    date: string;
  };
  questionnaireName?: string;
  scores: CategoryScore[];
  overallScore: number;
  reflections: {
    [category: string]: string[];
  };
}

interface ResultsPageProps {
  results: AssessmentResults;
  onRestart: () => void;
  onDownloadPDF: () => void;
  onEmailReport: () => void;
}

export const ResultsPage = ({ results, onRestart, onDownloadPDF, onEmailReport }: ResultsPageProps) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "High": return "success";
      case "Medium": return "warning";
      case "Low": return "destructive";
      default: return "secondary";
    }
  };

  const chartData = results.scores.map(score => ({
    name: score.category,
    value: score.percentage,
    color: score.color
  }));

  const spiralRadarData = results.scores.map(score => ({
    category: score.category,
    percentage: score.percentage,
    color: score.color
  }));

  const barChartData = results.scores.map(score => ({
    category: score.category.replace(/([A-Z])/g, ' $1').trim(),
    score: score.score,
    maxScore: score.maxScore,
    percentage: score.percentage
  }));

  const reflectionQuestions = {
    "Social Skills": [
      "How do you typically respond when someone disagrees with you?",
      "What communication style works best for you in different situations?",
      "How do you build rapport with new people?"
    ],
    "Self Awareness": [
      "What emotions do you find most challenging to manage?",
      "How do your values influence your daily decisions?",
      "What patterns do you notice in your stress responses?"
    ],
    "Motivating Self": [
      "What internal factors drive your motivation?",
      "How do you maintain focus when facing obstacles?",
      "What goals energize you the most?"
    ],
    "Empathy": [
      "How do you recognize emotional cues in others?",
      "What helps you understand different perspectives?",
      "How do you respond when someone is upset?"
    ],
    "Self Regulation": [
      "What strategies help you manage strong emotions?",
      "How do you handle pressure in challenging situations?",
      "What techniques help you stay calm and focused?"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-variant">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Assessment Results
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Congratulations on completing your emotional intelligence assessment!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={onDownloadPDF}
                variant="default"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF Report
              </Button>
              <Button
                onClick={onEmailReport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Report
              </Button>
              <Button
                onClick={onRestart}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Take Again
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Overall Score */}
            <div className="lg:col-span-1">
              <Card className="mb-6 shadow-soft border-border">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {results.overallScore}%
                  </div>
                  <Badge 
                    variant={getLevelColor(results.overallScore >= 75 ? "High" : results.overallScore >= 50 ? "Medium" : "Low")}
                    className="mb-4"
                  >
                    {results.overallScore >= 75 ? "High" : results.overallScore >= 50 ? "Medium" : "Low"} Performance
                  </Badge>
                  <div className="w-32 h-32 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Scores List */}
              <Card className="shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.scores.map((score, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{score.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{score.percentage}%</span>
                          <Badge variant={getLevelColor(score.level)} className="text-xs">
                            {score.level}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={score.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bar Chart */}
              <Card className="shadow-soft border-border">
                <CardHeader>
                  <CardTitle>Score Comparison</CardTitle>
                  <CardDescription>
                    Visual representation of your performance across all categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64" data-chart="bar">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                        <Bar dataKey="maxScore" fill="#e5e7eb" name="Max Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radar className="h-5 w-5 text-primary" />
                    Pentagon Analysis
                  </CardTitle>
                  <CardDescription>
                    Multi-dimensional view of your emotional intelligence profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center" data-chart="radar">
                  <RadarChart data={spiralRadarData} width={320} height={320} />
                </CardContent>
              </Card>

              {/* Spiral Chart */}
              <Card className="shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Growth Spiral
                  </CardTitle>
                  <CardDescription>
                    Your development journey across all competencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center" data-chart="spiral">
                  <SpiralChart data={spiralRadarData} width={320} height={320} />
                </CardContent>
              </Card>

              {/* Reflection Questions */}
              <Card className="shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Self-Reflection Questions
                  </CardTitle>
                  <CardDescription>
                    Take time to reflect on these questions to deepen your self-awareness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {results.scores.map((score, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold mb-3 text-foreground">
                          {score.category}
                        </h4>
                        <ul className="space-y-2">
                          {reflectionQuestions[score.category as keyof typeof reflectionQuestions]?.map((question, qIndex) => (
                            <li key={qIndex} className="text-sm text-muted-foreground">
                              • {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};