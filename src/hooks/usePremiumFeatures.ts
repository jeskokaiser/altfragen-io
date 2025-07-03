
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAICommentUsage } from './useAICommentUsage';

export const usePremiumFeatures = () => {
  const { subscribed, loading } = useSubscription();
  const { user } = useAuth();
  const { 
    canViewAIComments: canViewFree, 
    incrementUsage, 
    remainingFreeViews, 
    dailyUsage, 
    DAILY_LIMIT,
    isIncrementing 
  } = useAICommentUsage();

  // User must be logged in AND (have an active subscription OR have free views remaining)
  const canAccessAIComments = user && (subscribed || canViewFree);
  
  const requirePremiumForAI = async (callback: () => void) => {
    if (subscribed) {
      // Premium user - unlimited access
      callback();
    } else if (canViewFree && !isIncrementing) {
      // Free user with remaining views - increment usage first
      const success = await incrementUsage();
      if (success) {
        callback();
      } else {
        console.log('Failed to increment AI comment usage');
      }
    } else {
      // Free user who has exceeded daily limit or is currently incrementing
      console.log('Tägliches Limit für kostenlose KI-Kommentare erreicht oder Verarbeitung läuft');
    }
  };

  return {
    subscribed: !!subscribed,
    canAccessAIComments: !!canAccessAIComments,
    requirePremiumForAI,
    loading,
    isFreeTier: !subscribed,
    remainingFreeViews,
    dailyUsage,
    DAILY_LIMIT,
    incrementUsage,
    isIncrementing
  };
};
