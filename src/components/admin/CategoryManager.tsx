import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  questionnaire_id: string | null;
}

interface Questionnaire {
  id: string;
  title: string;
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    questionnaire_id: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchQuestionnaires();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        questionnaires(title)
      `)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
  };

  const fetchQuestionnaires = async () => {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('id, title')
      .order('title');

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
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setFormData({ name: "", description: "", questionnaire_id: "" });
      setIsEditing(false);
      setEditingId(null);
      fetchCategories();
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

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      questionnaire_id: category.questionnaire_id || "",
    });
    setEditingId(category.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      fetchCategories();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", questionnaire_id: "" });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</CardTitle>
          <CardDescription>
            Categories help organize questions in your questionnaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="questionnaire">Questionnaire</Label>
              <Select 
                value={formData.questionnaire_id} 
                onValueChange={(value) => setFormData({ ...formData, questionnaire_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a questionnaire (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific questionnaire</SelectItem>
                  {questionnaires.map((questionnaire) => (
                    <SelectItem key={questionnaire.id} value={questionnaire.id}>
                      {questionnaire.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your question categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                  {(category as any).questionnaires?.title && (
                    <p className="text-xs text-primary">
                      Questionnaire: {(category as any).questionnaires.title}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No categories found. Create your first category above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};