import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: (forceRefresh?: boolean) => Promise<void>;
  createCheckoutSession: (priceType?: 'monthly' | 'weekly', consentGiven?: boolean) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  subscriptionTier: null,
  subscriptionEnd: null,
  loading: true,
  checkSubscription: async () => {},
  createCheckoutSession: async () => {},
  openCustomerPortal: async () => {},
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const shouldUseCachedData = (cachedData: any): boolean => {
    if (!cachedData || !cachedData.timestamp) return false;
    
    const now = new Date();
    const cacheTime = new Date(cachedData.timestamp);
    
    // Check for recent checkout activity - be more aggressive with cache invalidation
    const recentCheckoutTime = localStorage.getItem(`checkout_initiated_${user?.id}`);
    if (recentCheckoutTime) {
      const checkoutInitiated = new Date(recentCheckoutTime);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      // If checkout was initiated within the last 30 minutes, use shorter cache
      if (checkoutInitiated > thirtyMinutesAgo) {
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const shouldUseShortCache = cacheTime < fiveMinutesAgo;
        
        if (shouldUseShortCache) {
          console.log('Using shorter cache due to recent checkout activity');
          return false; // Force refresh
        }
      } else {
        // Clean up old checkout timestamp
        localStorage.removeItem(`checkout_initiated_${user?.id}`);
      }
    }
    
    // If user is subscribed and has subscription_end
    if (cachedData.subscribed && cachedData.subscription_end) {
      const subscriptionEnd = new Date(cachedData.subscription_end);
      
      // If subscription ends more than 1 day from now, cache is valid for 23 hours
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (subscriptionEnd > oneDayFromNow) {
        const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
        return cacheTime > twentyThreeHoursAgo;
      }
      
      // If subscription ends within 1 day, cache for 2 hours only
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      return cacheTime > twoHoursAgo;
    }
    
    // For unsubscribed users, cache for 30 minutes
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    return cacheTime > thirtyMinutesAgo;
  };

  const getCachedSubscriptionData = () => {
    if (!user?.id) return null;
    
    try {
      const cached = localStorage.getItem(`subscription_${user.id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading cached subscription data:', error);
      return null;
    }
  };

  const setCachedSubscriptionData = (data: any) => {
    if (!user?.id) return;
    
    try {
      const cacheData = {
        ...data,
        timestamp: new Date().toISOString(),
        userId: user.id
      };
      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching subscription data:', error);
    }
  };

  const invalidateSubscriptionCache = () => {
    if (!user?.id) return;
    
    try {
      localStorage.removeItem(`subscription_${user.id}`);
      console.log('Subscription cache invalidated for user:', user.id);
    } catch (error) {
      console.error('Error invalidating subscription cache:', error);
    }
  };

  const checkSubscription = async (forceRefresh: boolean = false) => {
    if (!user) {
      console.log('No user found, setting unsubscribed state');
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    // Check cached data first (unless forced refresh)
    if (!forceRefresh) {
      const cachedData = getCachedSubscriptionData();
      if (cachedData && shouldUseCachedData(cachedData)) {
        console.log('Using cached subscription data from localStorage', {
          subscribed: cachedData.subscribed,
          tier: cachedData.subscription_tier,
          cacheAge: Math.round((Date.now() - new Date(cachedData.timestamp).getTime()) / (1000 * 60)) + ' minutes'
        });
        
        setSubscribed(cachedData.subscribed || false);
        setSubscriptionTier(cachedData.subscription_tier || null);
        setSubscriptionEnd(cachedData.subscription_end || null);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('Cache miss or forced refresh - calling edge function for user:', user.id);
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        console.error('No valid session found');
        throw new Error('No valid session found');
      }

      console.log('Invoking check-subscription function');
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Subscription check error details:', error);
        throw new Error(error.message || 'Failed to check subscription');
      }

      console.log('Subscription check result:', data);
      
      if (data) {
        const subscriptionData = {
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null
        };
        
        // Check if subscription status changed from unsubscribed to subscribed
        const cachedData = getCachedSubscriptionData();
        const wasUnsubscribed = cachedData && !cachedData.subscribed;
        const isNowSubscribed = subscriptionData.subscribed;
        
        if (wasUnsubscribed && isNowSubscribed) {
          console.log('🎉 Subscription status changed from unsubscribed to subscribed!');
          showToast.success('🎉 Premium erfolgreich aktiviert! Du hast jetzt Zugang zu allen Premium-Features.');
          
          // Clean up checkout tracking
          localStorage.removeItem(`checkout_initiated_${user.id}`);
        }
        
        // Update state
        setSubscribed(subscriptionData.subscribed);
        setSubscriptionTier(subscriptionData.subscription_tier);
        setSubscriptionEnd(subscriptionData.subscription_end);
        
        // Cache the data
        setCachedSubscriptionData(subscriptionData);
      } else {
        // Handle case where data is null/undefined
        const subscriptionData = {
          subscribed: false,
          subscription_tier: null,
          subscription_end: null
        };
        
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        
        // Cache the empty data
        setCachedSubscriptionData(subscriptionData);
      }
    } catch (error) {
      console.error('Überprüfung des Abonnements fehlgeschlagen:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast.error(`Überprüfung des Abonnementstatus fehlgeschlagen: ${errorMessage}`);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (priceType?: 'monthly' | 'weekly', consentGiven?: boolean) => {
    if (!user) {
      showToast.error('Bitte melde dich an, um ein Abonnement zu erstellen');
      return;
    }

    // Check if consent is given
    if (!consentGiven) {
      showToast.error('Bitte stimme den Bedingungen zu, um fortzufahren');
      return;
    }

    try {
      console.log('Creating checkout session for user:', user.id, 'priceType:', priceType);
      
      // Track when checkout was initiated for more aggressive cache invalidation
      localStorage.setItem(`checkout_initiated_${user.id}`, new Date().toISOString());
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No valid session found');
      }

      // Note: Consent is handled on the subscription page
      console.log('Creating checkout session for user:', user.id);

      console.log('Invoking create-checkout function');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: {
          priceType: priceType || 'monthly'
        }
      });

      if (error) {
        console.error('Checkout creation error details:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      console.log('Checkout session created:', data);
      if (data?.url) {
        // Invalidate cache before redirecting to ensure fresh check on return
        invalidateSubscriptionCache();
        
        // Redirect in same tab for better UX
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast.error(`Der Checkout-Prozess konnte nicht gestartet werden: ${errorMessage}`);
      
      // Clean up checkout tracking on error
      localStorage.removeItem(`checkout_initiated_${user.id}`);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      showToast.error('Bitte melde dich an, um dein Abonnement zu verwalten');
      return;
    }

    try {
      console.log('Creating authenticated customer portal session for user:', user.id);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No valid session found');
      }

      console.log('Invoking customer-portal function');
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Customer portal error details:', error);
        throw new Error(error.message || 'Failed to create customer portal session');
      }

      console.log('Customer portal session created:', data);
      if (data?.url) {
        // Invalidate cache before redirecting to ensure fresh check on return
        invalidateSubscriptionCache();
        
        // Redirect to the authenticated portal URL in the same tab
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast.error(`Fehler beim Öffnen des Kundenportals: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Clean up localStorage cache for other users (keep only current user's cache)
  useEffect(() => {
    if (user?.id) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('subscription_') && key !== `subscription_${user.id}`) {
            keysToRemove.push(key);
          }
          // Also clean up old checkout tracking for other users
          if (key?.startsWith('checkout_initiated_') && key !== `checkout_initiated_${user.id}`) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Error cleaning up old subscription cache:', error);
      }
    }
  }, [user?.id]);

  // Enhanced checkout success detection with multiple strategies
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasCheckoutSuccess = urlParams.get('checkout') === 'success';
    const hasCheckoutCancelled = urlParams.get('checkout') === 'cancelled';
    
    if (hasCheckoutSuccess) {
      showToast.success('Abonnement erfolgreich aktiviert!');
      // Remove the checkout parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Invalidate cache and force refresh subscription status
      invalidateSubscriptionCache();
      
      // Use multiple refresh attempts with increasing delays
      const refreshAttempts = [1000, 3000, 8000]; // 1s, 3s, 8s
      
      refreshAttempts.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`Checkout success refresh attempt ${index + 1}`);
          checkSubscription(true);
        }, delay);
      });
      
    } else if (hasCheckoutCancelled) {
      showToast.info('Der Checkout wurde abgebrochen');
      // Remove the checkout parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Clean up checkout tracking
      if (user?.id) {
        localStorage.removeItem(`checkout_initiated_${user.id}`);
      }
    }
    
    // Additional check: if user returns to the app and we have checkout tracking, do a refresh
    if (user?.id && !hasCheckoutSuccess && !hasCheckoutCancelled) {
      const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
      if (checkoutInitiated) {
        const checkoutTime = new Date(checkoutInitiated);
        const now = new Date();
        const timeSinceCheckout = now.getTime() - checkoutTime.getTime();
        
        // If checkout was initiated within the last 10 minutes, do a background refresh
        if (timeSinceCheckout < 10 * 60 * 1000) {
          console.log('Background subscription refresh due to recent checkout activity');
          setTimeout(() => {
            checkSubscription(true);
          }, 2000);
        }
      }
    }
  }, [user?.id]);

  // Periodic background refresh for users with recent checkout activity
  useEffect(() => {
    if (!user?.id) return;
    
    const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
    if (!checkoutInitiated) return;
    
    const checkoutTime = new Date(checkoutInitiated);
    const now = new Date();
    const timeSinceCheckout = now.getTime() - checkoutTime.getTime();
    
    // If checkout was within the last 30 minutes, set up periodic checks
    if (timeSinceCheckout < 30 * 60 * 1000) {
      const interval = setInterval(() => {
        const currentTime = new Date();
        const currentTimeSinceCheckout = currentTime.getTime() - checkoutTime.getTime();
        
        // Stop checking after 30 minutes
        if (currentTimeSinceCheckout > 30 * 60 * 1000) {
          localStorage.removeItem(`checkout_initiated_${user.id}`);
          clearInterval(interval);
          return;
        }
        
        // Check subscription status every 2 minutes
        console.log('Periodic subscription check due to recent checkout');
        checkSubscription(true);
      }, 2 * 60 * 1000); // Every 2 minutes
      
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return (
    <SubscriptionContext.Provider value={{
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      loading,
      checkSubscription,
      createCheckoutSession,
      openCustomerPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  return useContext(SubscriptionContext);
};
