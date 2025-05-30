
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAICommentUsage = () => {
  const { user } = useAuth();
  const [dailyUsage, setDailyUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const DAILY_LIMIT = 10;

  const checkDailyUsage = useCallback(async () => {
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
  }, [user]);

  const incrementUsage = useCallback(async () => {
    if (!user || isIncrementing) {
      console.log('Increment blocked: no user or already incrementing');
      return false;
    }

    // Prevent multiple concurrent increments
    setIsIncrementing(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, get the current usage to avoid race conditions
      const { data: currentData, error: fetchError } = await supabase
        .from('user_ai_comment_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current usage:', fetchError);
        return false;
      }

      const currentUsage = currentData?.usage_count || 0;
      const newUsage = currentUsage + 1;

      console.log(`Incrementing usage from ${currentUsage} to ${newUsage}`);

      const { error } = await supabase
        .from('user_ai_comment_usage')
        .upsert({
          user_id: user.id,
          date: today,
          usage_count: newUsage
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Update local state
      setDailyUsage(newUsage);
      console.log(`Successfully incremented usage to ${newUsage}`);
      return true;
    } catch (error) {
      console.error('Error in incrementUsage:', error);
      return false;
    } finally {
      setIsIncrementing(false);
    }
  }, [user, isIncrementing]);

  const canViewAIComments = dailyUsage < DAILY_LIMIT && !isIncrementing;
  const remainingFreeViews = Math.max(0, DAILY_LIMIT - dailyUsage);

  useEffect(() => {
    checkDailyUsage();
  }, [checkDailyUsage]);

  return {
    dailyUsage,
    canViewAIComments,
    remainingFreeViews,
    incrementUsage,
    loading,
    DAILY_LIMIT,
    isIncrementing
  };
};
