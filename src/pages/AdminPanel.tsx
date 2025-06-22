
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminRole } from '@/hooks/useAdminRole';
import SubjectReassignmentPanel from '@/components/admin/SubjectReassignmentPanel';
import AICommentarySettings from '@/components/ai-commentary/AICommentarySettings';
import AICommentaryQueue from '@/components/ai-commentary/AICommentaryQueue';
import AICommentaryStats from '@/components/ai-commentary/AICommentaryStats';
import AICommentaryLogs from '@/components/ai-commentary/AICommentaryLogs';
import { Settings, BarChart3, Clock, FileText, BookOpen } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { hasAdminRole, isLoading } = useAdminRole();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAdminRole) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              Access denied. Admin role required.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            AI Queue
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            AI Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <SubjectReassignmentPanel />
        </TabsContent>

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

export default AdminPanel;
