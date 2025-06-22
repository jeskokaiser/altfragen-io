import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SessionParticipant, PresenceState, PresenceUserState } from '@/types/ExamSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePresenceState } from '@supabase/supabase-js';

interface ParticipantsListProps {
  participants: SessionParticipant[];
  sessionId: string;
}

interface UserInfo {
  email: string | null;
}

// Transform the Supabase presence state to match our expected format
const formatPresenceState = (state: RealtimePresenceState<Record<string, any>>): Record<string, { online_at: string, presence_ref: string }> => {
  return Object.entries(state).reduce((acc, [key, values]) => {
    if (values && values.length > 0) {
      const userId = values[0].user_id;
      if (userId) {
        acc[userId] = {
          online_at: values[0].online_at,
          presence_ref: key
        };
      }
    }
    return acc;
  }, {} as Record<string, { online_at: string, presence_ref: string }>);
};

const ParticipantsList: React.FC<ParticipantsListProps> = ({ 
  participants,
  sessionId
}) => {
  const [userInfo, setUserInfo] = useState<Record<string, UserInfo>>({});
  const [presenceState, setPresenceState] = useState<RealtimePresenceState<Record<string, any>>>({});
  
  // Transform presence state to a more usable format
  const activeUsers = formatPresenceState(presenceState);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userIds = participants.map(p => p.user_id);
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (data) {
        const userMap: Record<string, UserInfo> = {};
        data.forEach(user => {
          userMap[user.id] = { email: user.email };
        });
        setUserInfo(userMap);
      }
    };

    if (participants.length > 0) {
      fetchUserInfo();
    }
  }, [participants]);

  // Set up presence channel to track user activity
  useEffect(() => {
    if (!sessionId) return;
    
    try {
      const channel = supabase.channel(`room_${sessionId}`);
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log('Current presence state:', state);
          setPresenceState(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
          // No need to update state here, sync will be called
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
          // No need to update state here, sync will be called
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to presence channel');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to presence channel');
            toast.error('Error connecting to real-time updates');
          }
        });
        
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up presence channel:', error);
      toast.error('Error connecting to real-time updates');
    }
  }, [sessionId]);

  const getInitials = (email: string | null) => {
    if (!email) return '?';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (userId: string) => {
    const email = userInfo[userId]?.email;
    if (!email) return 'Unknown User';
    return email.split('@')[0].replace('.', ' ');
  };

  // Check if a user is active based on presence data
  const isUserActive = (userId: string) => {
    return userId in activeUsers;
  };

  // Get the time when the user was last active
  const getLastActive = (userId: string) => {
    if (!activeUsers[userId]) return null;
    
    try {
      const lastActive = activeUsers[userId].online_at || null;
      if (!lastActive) return null;
      
      const lastActiveDate = new Date(lastActive);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastActiveDate.getTime()) / 1000);
      
      if (diffInSeconds < 120) return 'active now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return null;
    } catch (e) {
      return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.map((participant) => {
            const active = isUserActive(participant.user_id);
            const lastActive = getLastActive(participant.user_id);
            
            return (
              <div key={participant.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback className={active ? "bg-green-100 text-green-800" : ""}>
                      {getInitials(userInfo[participant.user_id]?.email)}
                    </AvatarFallback>
                  </Avatar>
                  {active && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
                  )}
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-medium">{getDisplayName(participant.user_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {lastActive ? 
                      <span className="text-green-600 dark:text-green-400">{lastActive}</span> :
                      `Joined ${new Date(participant.joined_at).toLocaleTimeString()}`
                    }
                  </p>
                </div>
                {participant.role === 'host' && (
                  <Badge variant="secondary">Host</Badge>
                )}
              </div>
            );
          })}
          
          {participants.length === 0 && (
            <p className="text-muted-foreground text-sm">No participants yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantsList;

// Export a hook to track user presence
export const useSessionPresence = (sessionId: string, userId: string | undefined) => {
  const [isTracking, setIsTracking] = useState(false);
  
  useEffect(() => {
    if (!sessionId || !userId) return;
    
    try {
      const channel = supabase.channel(`room_${sessionId}`);
      
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence with current timestamp
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
          
          setIsTracking(true);
          
          // Set up a timer to refresh presence data every 30 seconds
          const interval = setInterval(async () => {
            await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }, 30000);
          
          return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
            setIsTracking(false);
          };
        }
      });
      
      return () => {
        supabase.removeChannel(channel);
        setIsTracking(false);
      };
    } catch (error) {
      console.error('Error setting up presence tracking:', error);
      setIsTracking(false);
    }
  }, [sessionId, userId]);
  
  return { isTracking };
};
