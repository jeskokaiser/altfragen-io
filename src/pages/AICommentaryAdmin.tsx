
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AICommentarySettings from '@/components/ai-commentary/AICommentarySettings';
import AICommentaryQueue from '@/components/ai-commentary/AICommentaryQueue';
import AICommentaryStats from '@/components/ai-commentary/AICommentaryStats';
import AICommentaryLogs from '@/components/ai-commentary/AICommentaryLogs';
import { Settings, BarChart3, Clock, FileText } from 'lucide-react';

const AICommentaryAdmin: React.FC = () => {
  const { user } = useAuth();

  // For now, we'll check if user exists. In a real app, you'd check admin role
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              Please log in to access the admin panel.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Commentary Administration</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AICommentaryStats />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <AICommentarySettings />
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <AICommentaryQueue />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <AICommentaryLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICommentaryAdmin;
