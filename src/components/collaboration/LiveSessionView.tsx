
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LiveSessionViewProps {
  sessionId: string;
}

const LiveSessionView: React.FC<LiveSessionViewProps> = ({ sessionId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Live session view for session: {sessionId}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This component will handle real-time collaboration features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveSessionView;
