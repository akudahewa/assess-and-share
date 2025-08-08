import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { questionnairesApi, categoriesApi } from "@/lib/api";
import logo from "@/assets/logo.png";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

interface WelcomePageProps {
  onStartAssessment: () => void;
}

export const WelcomePage = ({ onStartAssessment }: WelcomePageProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('WelcomePage component loaded - categories:', categories.length);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // First get the active questionnaire
        const activeQuestionnairesResponse = await questionnairesApi.getActive();
        const activeQuestionnaires = activeQuestionnairesResponse.data as any[];

        if (!activeQuestionnaires || activeQuestionnaires.length === 0) {
          console.log('No active questionnaire found');
          setLoading(false);
          return;
        }

        // Then get categories for that questionnaire
        const categoriesResponse = await categoriesApi.getByQuestionnaire(activeQuestionnaires[0].id);
        setCategories(categoriesResponse.data as Category[] || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-variant">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Personal Assessment Platform" 
                className="h-10 w-10 object-contain"
              />
              <h1 className="text-xl font-semibold text-foreground">
                Personal Assessment Platform
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Personal Assessment
              <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent ml-2">
                Report Generator
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover your emotional intelligence profile with our comprehensive assessment. 
              Get personalized insights and actionable recommendations.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>15-20 minutes</span>
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Instant results</span>
              <CheckCircle className="h-4 w-4 text-success" />
              <span>PDF Report</span>
            </div>
            <Button
              onClick={onStartAssessment}
              variant="hero"
              size="lg"
              className="text-lg px-8 py-4 h-auto"
            >
              Start Your Assessment
            </Button>
          </div>

          {/* Assessment Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">
              What You'll Discover
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Show skeleton cards while loading
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="border-border shadow-soft">
                    <CardHeader className="text-center">
                      <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded animate-pulse" />
                      <div className="h-5 bg-muted rounded mx-auto w-24 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-12 bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <Card key={category.id} className="border-border shadow-soft hover:shadow-medium transition-shadow duration-300">
                    <CardHeader className="text-center">
                      {category.icon_url ? (
                        <img 
                          src={category.icon_url} 
                          alt={category.name}
                          className="h-12 w-12 mx-auto mb-4 object-contain"
                        />
                      ) : (
                        <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                      )}
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center text-sm">
                        {category.description || "Assessment category"}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No categories available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <Card className="bg-gradient-to-r from-primary-soft to-accent border-border shadow-soft">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  Your Personalized Report Includes
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium mb-1">Detailed Score Breakdown</h4>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive analysis of each emotional intelligence dimension
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium mb-1">Visual Charts & Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Interactive visualizations to understand your strengths
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium mb-1">Self-Reflection Questions</h4>
                      <p className="text-sm text-muted-foreground">
                        Thought-provoking questions to deepen your understanding
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium mb-1">PDF Report via Email</h4>
                      <p className="text-sm text-muted-foreground">
                        Professional report delivered directly to your inbox
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};