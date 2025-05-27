
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ExamSessionJoinPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode?: string }>();

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Join Exam Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code"
              defaultValue={inviteCode || ''}
            />
          </div>
          <Button className="w-full">Join Session</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSessionJoinPage;
