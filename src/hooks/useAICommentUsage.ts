
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAICommentUsage = () => {
  const { user } = useAuth();
  const [dailyUsage, setDailyUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const DAILY_LIMIT = 10;

  const checkDailyUsage = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has viewed AI comments today
      const { data, error } = await supabase
        .from('user_ai_comment_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking daily usage:', error);
        setDailyUsage(0);
      } else {
        setDailyUsage(data?.usage_count || 0);
      }
    } catch (error) {
      console.error('Error in checkDailyUsage:', error);
      setDailyUsage(0);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async () => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_ai_comment_usage')
        .upsert({
          user_id: user.id,
          date: today,
          usage_count: dailyUsage + 1
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      setDailyUsage(prev => prev + 1);
      return true;
    } catch (error) {
      console.error('Error in incrementUsage:', error);
      return false;
    }
  };

  const canViewAIComments = dailyUsage < DAILY_LIMIT;
  const remainingFreeViews = Math.max(0, DAILY_LIMIT - dailyUsage);

  useEffect(() => {
    checkDailyUsage();
  }, [user]);

  return {
    dailyUsage,
    canViewAIComments,
    remainingFreeViews,
    incrementUsage,
    loading,
    DAILY_LIMIT
  };
};
