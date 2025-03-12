
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Calendar, CheckCircle, Clock } from 'lucide-react';

interface TrainingSummaryProps {
  todayNew: number;
  todayPractice: number;
  totalAnswered: number;
  totalAttempts: number;
  userId?: string;
}

const TrainingSummary: React.FC<TrainingSummaryProps> = ({
  todayNew,
  todayPractice,
  totalAnswered,
  totalAttempts
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Training Summary
        </CardTitle>
        <CardDescription>
          Overview of your training progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>New Today</span>
          </div>
          <span className="font-semibold">{todayNew}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span>Practice Today</span>
          </div>
          <span className="font-semibold">{todayPractice}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-slate-500" />
            <span>Total Answered</span>
          </div>
          <span className="font-semibold">{totalAnswered}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-slate-500" />
            <span>Total Attempts</span>
          </div>
          <span className="font-semibold">{totalAttempts}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingSummary;
