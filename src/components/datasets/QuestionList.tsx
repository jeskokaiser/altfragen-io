
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QuestionSummary {
  id: string;
  filename: string;
  subject: string;
  difficulty: number;
  visibility: 'private' | 'university' | 'public';
  user_id: string | null;
  university_id: string | null;
  semester: string | null;
  year: string | null;
  exam_name: string | null;
  created_at: string;
}

interface QuestionListProps {
  questions: QuestionSummary[];
  isSelected: boolean;
}

const QuestionList = ({ questions, isSelected }: QuestionListProps) => {
  if (!isSelected) return null;

  // Group questions by subject
  const questionsBySubject = questions.reduce((acc, question) => {
    if (!acc[question.subject]) {
      acc[question.subject] = [];
    }
    acc[question.subject].push(question);
    return acc;
  }, {} as Record<string, QuestionSummary[]>);

  return (
    <>
      <Separator />
      <CardContent className="pt-4">
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Fragenübersicht nach Fach
          </h4>
          
          {Object.entries(questionsBySubject).map(([subject, subjectQuestions]) => (
            <div key={subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {subject}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {subjectQuestions.length} Fragen
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {subjectQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        ID: {question.id.slice(0, 8)}...
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Stufe {question.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

export default QuestionList;
