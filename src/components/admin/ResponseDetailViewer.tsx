import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { questionsApi, questionnairesApi } from "@/lib/api";
import { X, Calendar, User, Mail, Clock, FileText } from "lucide-react";

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

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating';
  options?: Array<{ value: string; label: string; score: number }>;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
}

interface ResponseDetailViewerProps {
  response: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResponseDetailViewer = ({ response, isOpen, onClose }: ResponseDetailViewerProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (response && isOpen) {
      fetchResponseDetails();
    }
  }, [response, isOpen]);

  const fetchResponseDetails = async () => {
    if (!response) return;
    
    setLoading(true);
    try {
      // Support both string and object for questionnaireId
      const questionnaireId =
        typeof response.questionnaireId === 'object' && response.questionnaireId !== null
          ? response.questionnaireId._id
          : response.questionnaireId;

      // Fetch questionnaire details
      const questionnaireResponse = await questionnairesApi.getById(questionnaireId);
      setQuestionnaire(questionnaireResponse.data as Questionnaire);

      // Fetch questions for this questionnaire
      const questionsResponse = await questionsApi.getByQuestionnaire(questionnaireId);
      setQuestions(questionsResponse.data as Question[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch response details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const renderResponseValue = (questionId: string, value: any) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return value;

    switch (question.type) {
      case 'multiple_choice': {
        // Always match value to option.value and display label
        const option = question.options?.find(opt => opt.value === value);
        return option ? option.label : value;
      }
      case 'rating':
        return `${value}/5`;
      case 'text':
        return value;
      default:
        return value;
    }
  };

  if (!response) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Response Details
          </DialogTitle>
          <DialogDescription>
            Detailed view of user response to questionnaire
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{response.userName || 'Anonymous User'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{response.userEmail || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Submitted:</span>
                    <span>{formatDate(response.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Time Spent:</span>
                    <span>{formatTimeSpent(response.timeSpent)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(response.status)}>
                    {getStatusText(response.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Questionnaire Information */}
            {questionnaire && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Questionnaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg">{questionnaire.title}</h3>
                  {questionnaire.description && (
                    <p className="text-muted-foreground mt-1">{questionnaire.description}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Responses</CardTitle>
                <CardDescription>
                  {Object.keys(response.responses || {}).length} questions answered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question) => {
                    const responseValue = response.responses[question.id];
                    if (!responseValue) return null;

                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">{question.text}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {question.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Answer: {renderResponseValue(question.id, responseValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(response.responses || {}).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No responses recorded
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
