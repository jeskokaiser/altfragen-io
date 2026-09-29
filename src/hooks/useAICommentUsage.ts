import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDailyUsage, incrementDailyUsage, usageDate } from '@/services/AICommentUsageService';
import { useAICommentarySettings } from './useAICommentarySettings';

export const useAICommentUsage = () => {
  const { user } = useAuth();
  const [dailyUsage, setDailyUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const {
    settings: { freeAiDailyLimit: dailyLimit },
  } = useAICommentarySettings();

  const checkDailyUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setDailyUsage(await fetchDailyUsage(user.id, usageDate()));
    } catch (error) {
      console.error('Error checking daily usage:', error);
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
      setDailyUsage(await incrementDailyUsage(user.id, usageDate()));
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    } finally {
      setIsIncrementing(false);
    }
  }, [user, isIncrementing]);

  const canViewAIComments = dailyUsage < dailyLimit && !isIncrementing;
  const remainingFreeViews = Math.max(0, dailyLimit - dailyUsage);

  useEffect(() => {
    checkDailyUsage();
  }, [checkDailyUsage]);

  return {
    dailyUsage,
    canViewAIComments,
    remainingFreeViews,
    incrementUsage,
    loading,
    DAILY_LIMIT: dailyLimit,
    isIncrementing,
  };
};
