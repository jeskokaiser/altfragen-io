
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

export const usePremiumFeatures = () => {
  const { subscribed, loading } = useSubscription();
  const { user } = useAuth();

  const isPremium = user && subscribed;
  const canAccessPremiumFeatures = isPremium;
  
  const requirePremium = (callback: () => void) => {
    if (canAccessPremiumFeatures) {
      callback();
    } else {
      // Could trigger a subscription modal or redirect
      console.log('Premium subscription required');
    }
  };

  return {
    isPremium,
    canAccessPremiumFeatures,
    requirePremium,
    loading,
  };
};
