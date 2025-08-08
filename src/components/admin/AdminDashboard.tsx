import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "./CategoryManager";
import { QuestionnaireManager } from "./QuestionnaireManager";
import { ScoringRulesManager } from "./ScoringRulesManager";
import { ResponseManager } from "./ResponseManager";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Users, FileText, Tags, Settings, BarChart3, User } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("categories");
  const { user } = useAuth();

  const handleLogout = async () => {
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.name || user.email}</span>
              </div>
            )}
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="scoring">Scoring Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>
          
          <TabsContent value="questionnaires">
            <QuestionnaireManager />
          </TabsContent>
          
          <TabsContent value="responses">
            <ResponseManager />
          </TabsContent>
          
          <TabsContent value="scoring">
            <ScoringRulesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};