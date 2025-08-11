import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { scoringRulesApi, questionnairesApi, categoriesApi, ApiError } from "@/lib/api";
import { Edit, Trash2 } from "lucide-react";

interface ScoringRule {
  id: string;
  questionnaireId: string;
  categoryId: string | null;
  minPercentage: number;
  maxPercentage: number;
  levelName: string;
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
    questionnaireId: "",
    categoryId: "",
    minPercentage: "",
    maxPercentage: "",
    levelName: "",
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
    try {
      const response = await scoringRulesApi.getAll();
      console.log('Scoring rules API response:', response);
      const rawData = (response as any)?.data || [];
      console.log('Raw scoring rules data:', rawData);
      
      // Normalize the data to match our frontend interface
      const normalized: ScoringRule[] = rawData.map((rule: any) => ({
        id: rule._id || rule.id,
        questionnaireId: rule.questionnaireId?._id || rule.questionnaireId,
        categoryId: rule.categoryId?._id || rule.categoryId,
        minPercentage: rule.minPercentage,
        maxPercentage: rule.maxPercentage,
        levelName: rule.levelName,
        description: rule.description,
        questionnaires: rule.questionnaireId,
        categories: rule.categoryId,
      }));
      
      console.log('Normalized scoring rules:', normalized);
      setScoringRules(normalized);
    } catch (error) {
      console.error('Error fetching scoring rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scoring rules",
        variant: "destructive",
      });
    }
  };

  const fetchQuestionnaires = async () => {
    try {
      const response = await questionnairesApi.getAll();
      const rawData = (response as any)?.data || [];
      console.log('Raw questionnaires data:', rawData);
      
      // Normalize the data to match our frontend interface
      const normalized: Questionnaire[] = rawData.map((q: any) => ({
        id: q._id || q.id,
        title: q.title,
      }));
      
      setQuestionnaires(normalized);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      const rawData = (response as any)?.data || [];
      console.log('Raw categories data:', rawData);
      
      // Normalize the data to match our frontend interface
      const normalized: Category[] = rawData.map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
      }));
      
      setCategories(normalized);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const minPercentage = parseFloat(formData.minPercentage);
      const maxPercentage = parseFloat(formData.maxPercentage);

      // Frontend validation
      if (minPercentage >= maxPercentage) {
        toast({
          title: "Validation Error",
          description: "Minimum percentage must be less than maximum percentage",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check for overlapping ranges with existing rules
      const overlappingRule = scoringRules.find(rule => {
        if (rule.questionnaireId !== formData.questionnaireId) return false;
        if (rule.id === editingId) return false; // Skip current rule when editing
        
        const ruleMin = rule.minPercentage;
        const ruleMax = rule.maxPercentage;
        
        // Check if ranges overlap
        return (minPercentage <= ruleMax && maxPercentage >= ruleMin);
      });

      if (overlappingRule) {
        toast({
          title: "Validation Error",
          description: `Range overlaps with existing rule "${overlappingRule.levelName}" (${overlappingRule.minPercentage}% - ${overlappingRule.maxPercentage}%)`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const submitData: any = {
        questionnaireId: formData.questionnaireId,
        minPercentage,
        maxPercentage,
        levelName: formData.levelName,
      };

      // Only include categoryId if it's not "all" (which means a specific category)
      if (formData.categoryId && formData.categoryId !== "all") {
        submitData.categoryId = formData.categoryId;
      }

      // Only include description if it's not empty
      if (formData.description && formData.description.trim()) {
        submitData.description = formData.description.trim();
      }

      console.log('Submitting scoring rule data:', submitData);

      if (editingId) {
        const response = await scoringRulesApi.update(editingId, submitData);
        console.log('Update response:', response);
        toast({
          title: "Success",
          description: "Scoring rule updated successfully",
        });
      } else {
        const response = await scoringRulesApi.create(submitData);
        console.log('Create response:', response);
        toast({
          title: "Success",
          description: "Scoring rule created successfully",
        });
      }

      setFormData({
        questionnaireId: "",
        categoryId: "",
        minPercentage: "",
        maxPercentage: "",
        levelName: "",
        description: "",
      });
      setIsEditing(false);
      setEditingId(null);
      fetchScoringRules();
    } catch (error: any) {
      console.error('Error creating/updating scoring rule:', error);
      let errorMessage = "Failed to create/update scoring rule";
      
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => `${e.path}: ${e.msg}`).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: ScoringRule) => {
    setFormData({
      questionnaireId: rule.questionnaireId,
      categoryId: rule.categoryId || "all",
      minPercentage: rule.minPercentage.toString(),
      maxPercentage: rule.maxPercentage.toString(),
      levelName: rule.levelName,
      description: rule.description || "",
    });
    setEditingId(rule.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scoring rule?")) return;

    try {
      await scoringRulesApi.delete(id);
      toast({
        title: "Success",
        description: "Scoring rule deleted successfully",
      });
      fetchScoringRules();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete scoring rule",
        variant: "destructive",
      });
    }
  };

  const getAvailableRanges = (questionnaireId: string) => {
    const existingRules = scoringRules.filter(rule => rule.questionnaireId === questionnaireId);
    if (existingRules.length === 0) {
      return "No rules yet - you can create rules for any percentage range (0-100%)";
    }
    
    const sortedRules = [...existingRules].sort((a, b) => a.minPercentage - b.minPercentage);
    const ranges = sortedRules.map(rule => `${rule.minPercentage}%-${rule.maxPercentage}%`);
    
    return `Existing ranges: ${ranges.join(', ')}. Available ranges: 0-${sortedRules[0].minPercentage}%, ${sortedRules[sortedRules.length - 1].maxPercentage}-100%`;
  };

  const resetForm = () => {
    setFormData({
      questionnaireId: "",
      categoryId: "",
      minPercentage: "",
      maxPercentage: "",
      levelName: "",
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
                <Label htmlFor="questionnaireId">Questionnaire</Label>
                <Select
                  value={formData.questionnaireId}
                  onValueChange={(value) => setFormData({ ...formData, questionnaireId: value })}
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
                <Label htmlFor="categoryId">Category (Optional)</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
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
                <Label htmlFor="minPercentage">Min Percentage</Label>
                <Input
                  id="minPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.minPercentage}
                  onChange={(e) => setFormData({ ...formData, minPercentage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPercentage">Max Percentage</Label>
                <Input
                  id="maxPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.maxPercentage}
                  onChange={(e) => setFormData({ ...formData, maxPercentage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelName">Level Name</Label>
                <Input
                  id="levelName"
                  value={formData.levelName}
                  onChange={(e) => setFormData({ ...formData, levelName: e.target.value })}
                  placeholder="e.g., High, Medium, Low"
                  required
                />
              </div>
            </div>
            
            {formData.questionnaireId && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {getAvailableRanges(formData.questionnaireId)}
              </div>
            )}
            
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
                  <h4 className="font-medium">{rule.levelName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {rule.questionnaires?.title} 
                    {rule.categories && ` - ${rule.categories.name}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rule.minPercentage}% - {rule.maxPercentage}%
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