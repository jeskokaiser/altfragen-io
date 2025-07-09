
import React from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AICommentarySettings from '@/components/ai-commentary/AICommentarySettings';
import AICommentaryStats from '@/components/ai-commentary/AICommentaryStats';
import SubjectReassignmentPanel from '@/components/admin/SubjectReassignmentPanel';
import CampaignManagement from '@/components/admin/CampaignManagement';
import { Settings, BarChart3, RefreshCw, AlertCircle, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AICommentaryAdmin: React.FC = () => {
  const { isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Access denied. You need administrator privileges to access this panel.
              </AlertDescription>
            </Alert>
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Kampagnen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AICommentaryStats />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <AICommentarySettings />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <SubjectReassignmentPanel />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICommentaryAdmin;
