
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Crown, Star } from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, email, is_premium, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('email', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const updateUserStatus = async (userId: string, field: 'is_premium' | 'is_admin', value: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${field.replace('is_', '')} status updated`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="space-y-4">
            {users?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{user.email}</span>
                    <div className="flex gap-1">
                      {user.is_admin && (
                        <Badge variant="destructive" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.is_premium && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`premium-${user.id}`} className="text-sm">
                      Premium
                    </Label>
                    <Switch
                      id={`premium-${user.id}`}
                      checked={user.is_premium}
                      onCheckedChange={(checked) => updateUserStatus(user.id, 'is_premium', checked)}
                      disabled={isUpdating}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`admin-${user.id}`} className="text-sm">
                      Admin
                    </Label>
                    <Switch
                      id={`admin-${user.id}`}
                      checked={user.is_admin}
                      onCheckedChange={(checked) => updateUserStatus(user.id, 'is_admin', checked)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>
            ))}

            {users?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No users found matching your search.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
