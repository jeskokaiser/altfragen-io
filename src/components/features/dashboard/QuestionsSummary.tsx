
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileQuestion, User, Users, AlertCircle } from 'lucide-react';

interface QuestionsSummaryProps {
  totalQuestions: number;
  publicQuestions: number;
  universityQuestions: number;
  unclearCount?: number;
  userId?: string;
}

const QuestionsSummary: React.FC<QuestionsSummaryProps> = ({
  totalQuestions,
  publicQuestions,
  universityQuestions,
  unclearCount = 0
}) => {
  const { profile } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileQuestion className="h-5 w-5" />
          Questions Summary
        </CardTitle>
        <CardDescription>
          Overview of questions in the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-slate-500" />
            <span>Total Questions</span>
          </div>
          <span className="font-semibold">{totalQuestions}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span>Public Questions</span>
          </div>
          <span className="font-semibold">{publicQuestions}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <span>University Questions</span>
          </div>
          <span className="font-semibold">{universityQuestions}</span>
        </div>
        {unclearCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Unclear Questions</span>
            </div>
            <span className="font-semibold">{unclearCount}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionsSummary;
