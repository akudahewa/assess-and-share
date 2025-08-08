import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userResponsesApi, questionnairesApi, ApiError } from "@/lib/api";
import { Download, Filter, Search, Eye, Calendar, User, Mail } from "lucide-react";
import { ResponseDetailViewer } from "./ResponseDetailViewer";

interface UserResponse {
  id: string;
  questionnaireId: string;
  userName?: string;
  userEmail?: string;
  responses: Record<string, any>;
  timeSpent?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
}

export const ResponseManager = () => {
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedResponse, setSelectedResponse] = useState<UserResponse | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestionnaires();
    fetchResponses();
  }, []);

  const fetchQuestionnaires = async () => {
    try {
      const response = await questionnairesApi.getAll();
      setQuestionnaires((response.data as Questionnaire[]) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questionnaires",
        variant: "destructive",
      });
    }
  };

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedQuestionnaire !== "all") {
        params.questionnaireId = selectedQuestionnaire;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await userResponsesApi.getAll(params);
      setResponses((response.data as UserResponse[]) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch responses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [selectedQuestionnaire, statusFilter, searchTerm]);

  const handleViewDetails = (response: UserResponse) => {
    setSelectedResponse(response);
    setIsDetailViewOpen(true);
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    setSelectedResponse(null);
  };

  const handleExport = async () => {
    try {
      // This would typically call an export endpoint
      toast({
        title: "Export",
        description: "Export functionality will be implemented",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export responses",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'abandoned':
        return 'Abandoned';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeSpent = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const sortedResponses = [...responses].sort((a, b) => {
    let aValue: any = a[sortBy as keyof UserResponse];
    let bValue: any = b[sortBy as keyof UserResponse];
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getQuestionnaireTitle = (questionnaireId: string) => {
    const questionnaire = questionnaires.find(q => q.id === questionnaireId);
    return questionnaire?.title || 'Unknown Questionnaire';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Management</CardTitle>
          <CardDescription>
            View and manage all user responses to questionnaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="questionnaire">Questionnaire</Label>
              <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire}>
                <SelectTrigger>
                  <SelectValue placeholder="All Questionnaires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questionnaires</SelectItem>
                  {questionnaires.map((questionnaire) => (
                    <SelectItem key={questionnaire.id} value={questionnaire.id}>
                      {questionnaire.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Submission Date</SelectItem>
                  <SelectItem value="userName">Name</SelectItem>
                  <SelectItem value="userEmail">Email</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {sortedResponses.length} response{sortedResponses.length !== 1 ? 's' : ''} found
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading responses...</p>
              </div>
            ) : sortedResponses.length > 0 ? (
              sortedResponses.map((response) => (
                <div key={response.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h4 className="font-medium">
                          {response.userName || 'Anonymous User'}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(response.status)}`}>
                          {getStatusText(response.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {response.userEmail || 'No email provided'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(response.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {getQuestionnaireTitle(response.questionnaireId)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Time: {formatTimeSpent(response.timeSpent)}</div>
                      <div>Questions: {Object.keys(response.responses || {}).length}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(response)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No responses found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ResponseDetailViewer
        response={selectedResponse}
        isOpen={isDetailViewOpen}
        onClose={handleCloseDetailView}
      />
    </div>
  );
};
