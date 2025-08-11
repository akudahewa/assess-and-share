import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { questionnairesApi, categoriesApi, ApiError } from "@/lib/api";
import { Plus, Edit, Trash2, Settings, Power } from "lucide-react";
import { QuestionManager } from "./QuestionManager";

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  categories?: Array<{
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export const QuestionnaireManager = () => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isActive: true,
    categories: [] as string[],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestionnaires();
    fetchCategories();
  }, []);

  const fetchQuestionnaires = async () => {
    try {
      const response = await questionnairesApi.getAll();
      const raw = (response as any)?.data || [];
      const normalized: Questionnaire[] = raw.map((q: any) => ({
        id: q.id || q._id,
        title: q.title,
        description: q.description ?? null,
        isActive: !!q.isActive,
        categories: (q.categories || []).map((c: any) => ({
          id: c.id || c._id,
          name: c.name,
          description: c.description,
          iconUrl: c.iconUrl || c.iconImageUrl || null,
        }))
      }));
      setQuestionnaires(normalized);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questionnaires",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories((response.data as Category[]) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res: any;
      if (editingId) {
        res = await questionnairesApi.update(editingId, formData);
        toast({ title: "Success", description: "Questionnaire updated successfully" });
      } else {
        res = await questionnairesApi.create({ ...formData, createdBy: "admin" });
        toast({ title: "Success", description: "Questionnaire created successfully" });
      }

      const affectedId: string | null = (res as any)?.data?._id || (res as any)?.data?.id || editingId;

      setFormData({ title: "", description: "", isActive: true, categories: [] });
      setIsEditing(false);
      setEditingId(null);

      // Optimistically enforce single-active in UI if we just activated one
      if (formData.isActive && affectedId) {
        setQuestionnaires(prev => prev.map(q => ({ ...q, isActive: q.id === affectedId })));
      }
      // Refresh from server to ensure state matches DB
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
      isActive: questionnaire.isActive,
      categories: questionnaire.categories?.map(cat => cat.id) || [],
    });
    setEditingId(questionnaire.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this questionnaire? This will also delete all associated questions.")) return;

    try {
      await questionnairesApi.delete(id);
      toast({
        title: "Success",
        description: "Questionnaire deleted successfully",
      });
      fetchQuestionnaires();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete questionnaire",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", isActive: true, categories: [] });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleActivate = async (questionnaireId: string) => {
    try {
      await questionnairesApi.activate(questionnaireId);

      toast({
        title: "Success",
        description: "Questionnaire activated successfully",
      });

      fetchQuestionnaires();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    }
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
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={formData.categories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            categories: [...formData.categories, category.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            categories: formData.categories.filter(id => id !== category.id)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No categories available. Create categories first.</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
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
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      questionnaire.isActive 
                        ? 'bg-green-100 text-green-800 font-medium' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {questionnaire.isActive ? '✓ Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={questionnaire.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleActivate(questionnaire.id)}
                    disabled={questionnaire.isActive}
                    style={{
                      backgroundColor: questionnaire.isActive ? '#059669' : undefined,
                      color: questionnaire.isActive ? 'white' : undefined,
                      cursor: questionnaire.isActive ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Power className="w-4 h-4 mr-1" />
                    {questionnaire.isActive ? "Active" : "Activate"}
                  </Button>
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