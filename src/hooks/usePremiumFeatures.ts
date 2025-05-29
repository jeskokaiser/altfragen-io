
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAICommentUsage } from './useAICommentUsage';

export const usePremiumFeatures = () => {
  const { subscribed, loading } = useSubscription();
  const { user } = useAuth();
  const { canViewAIComments: canViewFree, incrementUsage, remainingFreeViews, dailyUsage, DAILY_LIMIT } = useAICommentUsage();

  // User must be logged in AND (have an active subscription OR have free views remaining)
  const isPremium = user && subscribed;
  const canAccessAIComments = user && (subscribed || canViewFree);
  
  const requirePremiumForAI = async (callback: () => void) => {
    if (subscribed) {
      // Premium user - unlimited access
      callback();
    } else if (canViewFree) {
      // Free user with remaining views
      const success = await incrementUsage();
      if (success) {
        callback();
      }
    } else {
      // Free user who has exceeded daily limit
      console.log('Tägliches Limit für kostenlose KI-Kommentare erreicht');
    }
  };

  return {
    isPremium: !!isPremium,
    canAccessAIComments: !!canAccessAIComments,
    requirePremiumForAI,
    loading,
    isFreeTier: !subscribed,
    remainingFreeViews,
    dailyUsage,
    DAILY_LIMIT,
    incrementUsage
  };
};
