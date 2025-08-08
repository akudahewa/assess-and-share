import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { questionsApi, categoriesApi, ApiError } from "@/lib/api";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";

interface AnswerOption {
  text: string;
  score: number;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options: any;
  order_number: number;
  category_id: string;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface QuestionManagerProps {
  questionnaireId: string;
  onBack: () => void;
}

export const QuestionManager = ({ questionnaireId, onBack }: QuestionManagerProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    type: "multiple_choice",
    category_id: "none",
    options: [
      { text: "", score: 1 },
      { text: "", score: 2 },
      { text: "", score: 3 },
      { text: "", score: 4 },
    ] as AnswerOption[],
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [questionnaireId]);

  const fetchQuestions = async () => {
    try {
      const response = await questionsApi.getByQuestionnaire(questionnaireId);
      setQuestions((response.data || []).map(q => ({
        ...q,
        options: q.options as any
      })));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll({ questionnaireId });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nextOrderNumber = Math.max(0, ...questions.map(q => q.order_number)) + 1;
      
      const submitData = {
        questionnaire_id: questionnaireId,
        category_id: formData.category_id === "none" ? null : formData.category_id,
        text: formData.text,
        type: formData.type,
        options: formData.type === 'multiple_choice' ? formData.options.filter(opt => opt.text.trim()) as any : null,
        order_number: editingId ? undefined : nextOrderNumber,
      };

      if (editingId) {
        await questionsApi.update(editingId, submitData);
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        await questionsApi.create(submitData);
        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      setFormData({
        text: "",
        type: "multiple_choice",
        category_id: "none",
        options: [
          { text: "", score: 1 },
          { text: "", score: 2 },
          { text: "", score: 3 },
          { text: "", score: 4 },
        ],
      });
      setIsEditing(false);
      setEditingId(null);
      fetchQuestions();
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

  const handleEdit = (question: Question) => {
    setFormData({
      text: question.text,
      type: question.type,
      category_id: question.category_id || "none",
      options: (question.options as AnswerOption[]) || [
        { text: "", score: 1 },
        { text: "", score: 2 },
        { text: "", score: 3 },
        { text: "", score: 4 },
      ],
    });
    setEditingId(question.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await questionsApi.delete(id);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      text: "",
      type: "multiple_choice",
      category_id: "none",
      options: [
        { text: "", score: 1 },
        { text: "", score: 2 },
        { text: "", score: 3 },
        { text: "", score: 4 },
      ],
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const updateOption = (index: number, field: 'text' | 'score', value: string | number) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...formData.options, { text: "", score: formData.options.length + 1 }];
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questionnaires
        </Button>
        <h2 className="text-2xl font-bold">Manage Questions</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Question' : 'Add New Question'}</CardTitle>
          <CardDescription>
            Create questions for this questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Question Text</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Question Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'multiple_choice' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={option.score}
                        onChange={(e) => updateOption(index, 'score', parseInt(e.target.value) || 0)}
                        placeholder="Score"
                        min="0"
                      />
                    </div>
                    {formData.options.length > 2 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
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
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            Manage questions for this questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{question.text}</h4>
                  <p className="text-sm text-muted-foreground">
                    Category: {question.categories?.name} | Type: {question.type}
                  </p>
                  {question.options && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Options: {(question.options as AnswerOption[]).map(opt => `${opt.text} (${opt.score})`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(question)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(question.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No questions found. Create your first question above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};