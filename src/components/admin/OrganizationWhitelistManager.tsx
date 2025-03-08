
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllOrganizations, whitelistOrganization, unwhitelistOrganization } from '@/services/OrganizationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseOrganization } from '@/types/api/database';
import { showToast } from '@/utils/toast';
import { Switch } from '@/components/ui/switch';

const OrganizationWhitelistManager: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
  });

  const toggleWhitelistMutation = useMutation({
    mutationFn: async ({ 
      organizationId, 
      whitelist 
    }: { 
      organizationId: string, 
      whitelist: boolean 
    }) => {
      if (whitelist) {
        return whitelistOrganization(organizationId);
      } else {
        return unwhitelistOrganization(organizationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      showToast.success('Organization whitelist status updated');
    },
    onError: (error) => {
      console.error('Failed to update whitelist status:', error);
      showToast.error('Failed to update whitelist status');
    }
  });

  const handleToggleWhitelist = async (organization: DatabaseOrganization) => {
    const newStatus = !organization.is_whitelisted;
    await toggleWhitelistMutation.mutate({ 
      organizationId: organization.id!, 
      whitelist: newStatus 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Whitelist Management</CardTitle>
        <CardDescription>
          Control which organizations are allowed to share questions with their members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading organizations...</p>
          </div>
        ) : organizations && organizations.length > 0 ? (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">{org.domain}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(org.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {org.is_whitelisted ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Whitelisted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      Not Whitelisted
                    </Badge>
                  )}
                  <Switch
                    checked={org.is_whitelisted}
                    onCheckedChange={() => handleToggleWhitelist(org)}
                    disabled={toggleWhitelistMutation.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <p>No organizations found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationWhitelistManager;
