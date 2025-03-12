
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trophy, Target, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTodayNewCount, 
  fetchTodayPracticeCount, 
  fetchTotalAnsweredCount 
} from '@/services/QuestionService';

interface TrainingSummaryProps {
  userId?: string | null;
}

const TrainingSummary: React.FC<TrainingSummaryProps> = ({ userId }) => {
  const { data: todayNewCount = 0 } = useQuery({
    queryKey: ['todayNewCount', userId],
    queryFn: () => fetchTodayNewCount(userId!),
    enabled: !!userId
  });

  const { data: todayPracticeCount = 0 } = useQuery({
    queryKey: ['todayPracticeCount', userId],
    queryFn: () => fetchTodayPracticeCount(userId!),
    enabled: !!userId
  });

  const { data: totalAnsweredCount = 0 } = useQuery({
    queryKey: ['totalAnsweredCount', userId],
    queryFn: () => fetchTotalAnsweredCount(userId!),
    enabled: !!userId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Training Progress
        </CardTitle>
        <CardDescription>
          Track your daily and overall progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span>Today's New Questions</span>
          </div>
          <span className="font-semibold">{todayNewCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Today's Practice</span>
          </div>
          <span className="font-semibold">{todayPracticeCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>Total Answered</span>
          </div>
          <span className="font-semibold">{totalAnsweredCount}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingSummary;
