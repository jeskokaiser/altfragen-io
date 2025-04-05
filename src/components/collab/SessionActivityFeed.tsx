
// Note: I'm only modifying the parts of this file with type errors and not changing functionality

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionActivity, SessionActivityDb } from '@/types/ExamSession';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SessionActivityFeedProps {
  sessionId: string;
}

interface User {
  id: string;
  email: string;
}

const SessionActivityFeed: React.FC<SessionActivityFeedProps> = ({ sessionId }) => {
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionActivities = async () => {
      try {
        // Using type assertion to handle the session_activities table
        const { data, error } = await supabase
          .from('session_activities' as any)
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data) {
          // Convert the data to the SessionActivity type
          const formattedActivities: SessionActivity[] = (data as any[]).map((item: SessionActivityDb) => ({
            id: item.id,
            session_id: item.session_id,
            user_id: item.user_id,
            activity_type: item.activity_type,
            message: item.message,
            entity_id: item.entity_id || undefined,
            created_at: item.created_at
          }));
          
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Error fetching session activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionActivities();

    // Subscribe to real-time updates for session activities
    const channel = supabase
      .channel(`session-activities-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_activities',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const newActivity = payload.new as SessionActivityDb;
        
        // Convert to SessionActivity type
        const formattedActivity: SessionActivity = {
          id: newActivity.id,
          session_id: newActivity.session_id,
          user_id: newActivity.user_id,
          activity_type: newActivity.activity_type,
          message: newActivity.message,
          entity_id: newActivity.entity_id || undefined,
          created_at: newActivity.created_at
        };
        
        setActivities(prevActivities => [formattedActivity, ...prevActivities]);
      })
      .subscribe();

    // Get the profile information for all users
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email');

        if (error) throw error;

        if (data) {
          const usersMap: Record<string, User> = {};
          data.forEach(user => {
            usersMap[user.id] = {
              id: user.id,
              email: user.email || ''
            };
          });
          setUsers(usersMap);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const addActivity = async (activity: Omit<SessionActivity, 'id' | 'created_at'>) => {
    try {
      // Using type assertion to handle the session_activities table
      const { data, error } = await supabase
        .from('session_activities' as any)
        .insert({
          session_id: activity.session_id,
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          message: activity.message,
          entity_id: activity.entity_id
        })
        .select()
        .single();

      if (error) throw error;
      
      // No need to update state here as the real-time subscription will handle it
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Activity</CardTitle>
        </CardHeader>
        <CardContent>Loading activities...</CardContent>
      </Card>
    );
  }

  // Create a simple UserAvatar component
  const UserAvatar = ({ user }: { user?: User }) => {
    const getInitials = (email: string) => {
      if (!email) return '?';
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    };

    return (
      <Avatar>
        <AvatarFallback>
          {user ? getInitials(user.email) : '?'}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground">No activity yet.</p>
        ) : (
          activities.map(activity => {
            const user = users[activity.user_id];
            return (
              <div key={activity.id} className="flex items-center space-x-2">
                <UserAvatar user={user} />
                <div>
                  <p className="text-sm">
                    {user ? user.email : 'Unknown User'} {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default SessionActivityFeed;
