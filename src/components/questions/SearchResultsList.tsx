import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EditQuestionModal from '@/components/training/EditQuestionModal';
import { Pencil, Lock, GraduationCap, Globe, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResultsListProps {
  questions: Question[];
  onQuestionUpdated?: (updatedQuestion: Question) => void;
  isLoading?: boolean;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  questions,
  onQuestionUpdated,
  isLoading = false
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleExpand = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      case 'university':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />;
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getVisibilityLabel = (visibility?: string) => {
    switch (visibility) {
      case 'private':
        return 'Privat';
      case 'university':
        return 'Universität';
      case 'public':
        return 'Öffentlich';
      default:
        return 'Privat';
    }
  };

  const canEditQuestion = (question: Question) => {
    if (!user) return false;
    return (
      user.id === question.user_id ||
      (user.user_metadata?.university_id === question.university_id &&
        question.visibility === 'university')
    );
  };

  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleQuestionUpdated = (updatedQuestion: Question) => {
    if (onQuestionUpdated) {
      onQuestionUpdated(updatedQuestion);
    }
    setIsEditModalOpen(false);
    setSelectedQuestion(null);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lade Ergebnisse...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Fragen gefunden.</p>
      </div>
    );
  }

  if (isMobile) {
    // Mobile view: Card layout
    return (
      <>
        <div className="space-y-4">
          {questions.map((question) => {
            const isExpanded = expandedQuestions.has(question.id);
            const canEdit = canEditQuestion(question);

            return (
              <Card key={question.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {isExpanded ? question.question : truncateText(question.question, 80)}
                      </p>
                      {!isExpanded && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1 text-xs"
                          onClick={() => toggleExpand(question.id)}
                        >
                          Mehr anzeigen
                        </Button>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(question)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {question.subject}
                    </Badge>
                    {question.exam_name && (
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {question.exam_name}
                      </Badge>
                    )}
                    {(question.semester || question.year) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {[question.semester, question.year].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {getVisibilityIcon(question.visibility)}
                      <span>{getVisibilityLabel(question.visibility)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Schwierigkeit: {question.difficulty || 3}
                    </Badge>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t space-y-2">
                      <div className="text-xs space-y-1">
                        <p><strong>A:</strong> {question.optionA}</p>
                        <p><strong>B:</strong> {question.optionB}</p>
                        <p><strong>C:</strong> {question.optionC}</p>
                        <p><strong>D:</strong> {question.optionD}</p>
                        {question.optionE && <p><strong>E:</strong> {question.optionE}</p>}
                      </div>
                      <p className="text-xs">
                        <strong>Richtige Antwort:</strong> {question.correctAnswer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Kommentar:</strong> {question.comment || '-'}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => toggleExpand(question.id)}
                      >
                        Weniger anzeigen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedQuestion && (
          <EditQuestionModal
            question={selectedQuestion}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedQuestion(null);
            }}
            onQuestionUpdated={handleQuestionUpdated}
          />
        )}
      </>
    );
  }

  // Desktop view: Table layout
  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Frage</TableHead>
              <TableHead>Fach</TableHead>
              <TableHead>Modul/Prüfung</TableHead>
              <TableHead>Semester/Jahr</TableHead>
              <TableHead>Schwierigkeit</TableHead>
              <TableHead>Sichtbarkeit</TableHead>
              <TableHead className="w-[80px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => {
              const isExpanded = expandedQuestions.has(question.id);
              const canEdit = canEditQuestion(question);

              return (
                <TableRow key={question.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className={isExpanded ? '' : 'line-clamp-2'}>
                        {question.question}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => toggleExpand(question.id)}
                      >
                        {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                      </Button>
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t text-xs space-y-1 text-muted-foreground">
                          <p><strong>A:</strong> {question.optionA}</p>
                          <p><strong>B:</strong> {question.optionB}</p>
                          <p><strong>C:</strong> {question.optionC}</p>
                          <p><strong>D:</strong> {question.optionD}</p>
                          {question.optionE && <p><strong>E:</strong> {question.optionE}</p>}
                          <p className="mt-1">
                            <strong>Richtige Antwort:</strong> {question.correctAnswer}
                          </p>
                          <p>
                            <strong>Kommentar:</strong> {question.comment || '-'}
                          </p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{question.subject}</Badge>
                  </TableCell>
                  <TableCell>
                    {question.exam_name ? (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{question.exam_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {question.semester || question.year ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {[question.semester, question.year].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{question.difficulty || 3}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon(question.visibility)}
                      <span className="text-sm">{getVisibilityLabel(question.visibility)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(question)}
                        title="Frage bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedQuestion && (
        <EditQuestionModal
          question={selectedQuestion}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedQuestion(null);
          }}
          onQuestionUpdated={handleQuestionUpdated}
        />
      )}
    </>
  );
};

