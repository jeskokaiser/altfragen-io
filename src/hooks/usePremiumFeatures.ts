
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

export const usePremiumFeatures = () => {
  const { subscribed, loading } = useSubscription();
  const { user } = useAuth();

  // User must be logged in AND have an active subscription
  const isPremium = user && subscribed;
  const canAccessAIComments = isPremium;
  
  const requirePremiumForAI = (callback: () => void) => {
    if (canAccessAIComments) {
      callback();
    } else {
      // Could trigger a subscription modal or redirect
      console.log('Premium-Abonnement für KI-Kommentare erforderlich');
    }
  };

  return {
    isPremium: !!isPremium,
    canAccessAIComments: !!canAccessAIComments,
    requirePremiumForAI,
    loading,
  };
};
