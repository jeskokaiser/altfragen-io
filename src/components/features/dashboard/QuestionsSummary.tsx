
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart, Folders, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface QuestionsSummaryProps {
  totalQuestions: number;
  unclearCount: number;
  userId?: string | null;
}

const QuestionsSummary: React.FC<QuestionsSummaryProps> = ({ 
  totalQuestions, 
  unclearCount, 
  userId 
}) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Questions Overview
        </CardTitle>
        <CardDescription>
          Track your questions and manage unclear ones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folders className="h-4 w-4 text-slate-500" />
            <span>Total Questions</span>
          </div>
          <span className="font-semibold">{totalQuestions}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span>Unclear Questions</span>
          </div>
          <span className="font-semibold">{unclearCount}</span>
        </div>

        {unclearCount > 0 && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/unclear')}
          >
            Review Unclear Questions
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionsSummary;
