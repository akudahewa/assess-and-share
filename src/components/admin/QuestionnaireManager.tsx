import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { QuestionManager } from "./QuestionManager";

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
}

export const QuestionnaireManager = () => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const fetchQuestionnaires = async () => {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questionnaires",
        variant: "destructive",
      });
    } else {
      setQuestionnaires(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (editingId) {
        const { error } = await supabase
          .from('questionnaires')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Questionnaire updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('questionnaires')
          .insert([{ ...formData, created_by: userData.user?.id }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Questionnaire created successfully",
        });
      }

      setFormData({ title: "", description: "", is_active: true });
      setIsEditing(false);
      setEditingId(null);
      fetchQuestionnaires();
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

  const handleEdit = (questionnaire: Questionnaire) => {
    setFormData({
      title: questionnaire.title,
      description: questionnaire.description || "",
      is_active: questionnaire.is_active,
    });
    setEditingId(questionnaire.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this questionnaire? This will also delete all associated questions.")) return;

    const { error } = await supabase
      .from('questionnaires')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete questionnaire",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Questionnaire deleted successfully",
      });
      fetchQuestionnaires();
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", is_active: true });
    setIsEditing(false);
    setEditingId(null);
  };

  if (showQuestions) {
    return (
      <QuestionManager 
        questionnaireId={showQuestions} 
        onBack={() => setShowQuestions(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Questionnaire' : 'Add New Questionnaire'}</CardTitle>
          <CardDescription>
            Create questionnaires to organize your assessment questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questionnaires</CardTitle>
          <CardDescription>
            Manage your questionnaires and their questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questionnaires.map((questionnaire) => (
              <div key={questionnaire.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{questionnaire.title}</h4>
                  {questionnaire.description && (
                    <p className="text-sm text-muted-foreground">{questionnaire.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {questionnaire.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuestions(questionnaire.id)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Questions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(questionnaire)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(questionnaire.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {questionnaires.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No questionnaires found. Create your first questionnaire above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};