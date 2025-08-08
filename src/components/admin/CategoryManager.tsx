import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { categoriesApi, questionnairesApi, ApiError } from "@/lib/api";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  questionnaire_id: string | null;
  icon_url: string | null;
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
    questionnaire_id: "none",
    icon_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchQuestionnaires();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const fetchQuestionnaires = async () => {
    try {
      const response = await questionnairesApi.getAll();
      setQuestionnaires(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questionnaires",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload icon if a new file is selected
      let iconUrl = formData.icon_url;
      if (selectedFile) {
        iconUrl = await handleIconUpload();
        if (iconUrl === null) {
          setLoading(false);
          return;
        }
      }

      // Convert "none" back to null for database storage
      const submitData = {
        ...formData,
        questionnaire_id: formData.questionnaire_id === "none" ? null : formData.questionnaire_id,
        icon_url: iconUrl || null
      };

      if (editingId) {
        await categoriesApi.update(editingId, submitData);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await categoriesApi.create(submitData);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setFormData({ name: "", description: "", questionnaire_id: "none", icon_url: "" });
      setIsEditing(false);
      setEditingId(null);
      setSelectedFile(null);
      setPreviewUrl(null);
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
      questionnaire_id: category.questionnaire_id || "none",
      icon_url: category.icon_url || "",
    });
    setEditingId(category.id);
    setIsEditing(true);
    setPreviewUrl(category.icon_url);
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoriesApi.delete(id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", questionnaire_id: "none", icon_url: "" });
    setIsEditing(false);
    setEditingId(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error", 
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleIconUpload = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('category-icons')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to upload icon: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeIcon = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({ ...formData, icon_url: "" });
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
                  <SelectItem value="none">No specific questionnaire</SelectItem>
                  {questionnaires.map((questionnaire) => (
                    <SelectItem key={questionnaire.id} value={questionnaire.id}>
                      {questionnaire.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <div className="flex items-center gap-4">
                {previewUrl ? (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Category icon preview" 
                      className="w-16 h-16 object-contain border rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeIcon}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Choose Icon'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
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
                <div className="flex items-center gap-3">
                  {category.icon_url ? (
                    <img 
                      src={category.icon_url} 
                      alt={category.name}
                      className="w-10 h-10 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
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