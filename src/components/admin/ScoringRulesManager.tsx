import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash2 } from "lucide-react";

interface ScoringRule {
  id: string;
  questionnaire_id: string;
  category_id: string | null;
  min_percentage: number;
  max_percentage: number;
  level_name: string;
  description: string | null;
  questionnaires: { title: string } | null;
  categories: { name: string } | null;
}

interface Questionnaire {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

export const ScoringRulesManager = () => {
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    questionnaire_id: "",
    category_id: "",
    min_percentage: "",
    max_percentage: "",
    level_name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchScoringRules();
    fetchQuestionnaires();
    fetchCategories();
  }, []);

  const fetchScoringRules = async () => {
    const { data, error } = await supabase
      .from('scoring_rules')
      .select(`
        *,
        questionnaires(title),
        categories(name)
      `)
      .order('questionnaire_id', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch scoring rules",
        variant: "destructive",
      });
    } else {
      setScoringRules(data || []);
    }
  };

  const fetchQuestionnaires = async () => {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('id, title')
      .order('title');

    if (error) {
      console.error('Error fetching questionnaires:', error);
    } else {
      setQuestionnaires(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        questionnaire_id: formData.questionnaire_id,
        category_id: formData.category_id === "all" ? null : formData.category_id || null,
        min_percentage: parseFloat(formData.min_percentage),
        max_percentage: parseFloat(formData.max_percentage),
        level_name: formData.level_name,
        description: formData.description || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('scoring_rules')
          .update(submitData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Scoring rule updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('scoring_rules')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Scoring rule created successfully",
        });
      }

      setFormData({
        questionnaire_id: "",
        category_id: "",
        min_percentage: "",
        max_percentage: "",
        level_name: "",
        description: "",
      });
      setIsEditing(false);
      setEditingId(null);
      fetchScoringRules();
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

  const handleEdit = (rule: ScoringRule) => {
    setFormData({
      questionnaire_id: rule.questionnaire_id,
      category_id: rule.category_id || "all",
      min_percentage: rule.min_percentage.toString(),
      max_percentage: rule.max_percentage.toString(),
      level_name: rule.level_name,
      description: rule.description || "",
    });
    setEditingId(rule.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scoring rule?")) return;

    const { error } = await supabase
      .from('scoring_rules')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete scoring rule",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Scoring rule deleted successfully",
      });
      fetchScoringRules();
    }
  };

  const resetForm = () => {
    setFormData({
      questionnaire_id: "",
      category_id: "",
      min_percentage: "",
      max_percentage: "",
      level_name: "",
      description: "",
    });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Scoring Rule' : 'Add New Scoring Rule'}</CardTitle>
          <CardDescription>
            Define scoring ranges and levels for questionnaire categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionnaire_id">Questionnaire</Label>
                <Select
                  value={formData.questionnaire_id}
                  onValueChange={(value) => setFormData({ ...formData, questionnaire_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select questionnaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionnaires.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category (Optional)</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_percentage">Min Percentage</Label>
                <Input
                  id="min_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.min_percentage}
                  onChange={(e) => setFormData({ ...formData, min_percentage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_percentage">Max Percentage</Label>
                <Input
                  id="max_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.max_percentage}
                  onChange={(e) => setFormData({ ...formData, max_percentage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level_name">Level Name</Label>
                <Input
                  id="level_name"
                  value={formData.level_name}
                  onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
                  placeholder="e.g., High, Medium, Low"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Description for this scoring level"
              />
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
          <CardTitle>Scoring Rules</CardTitle>
          <CardDescription>
            Manage scoring rules for your questionnaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoringRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{rule.level_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {rule.questionnaires?.title} 
                    {rule.categories && ` - ${rule.categories.name}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rule.min_percentage}% - {rule.max_percentage}%
                  </p>
                  {rule.description && (
                    <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {scoringRules.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No scoring rules found. Create your first scoring rule above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};