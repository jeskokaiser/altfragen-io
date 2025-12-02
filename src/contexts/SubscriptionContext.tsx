import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: (priceType?: 'monthly' | 'semester', consentGiven?: boolean) => Promise<void>;
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


  const checkSubscription = async () => {
    if (!user) {
      console.log('No user found, setting unsubscribed state');
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Querying subscribers table for user:', user.id);
      setLoading(true);
      
      // Query subscribers table directly - webhook updates this in real-time
      const { data: subscriberData, error } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (error) {
        console.error('Subscription query error:', error);
        throw new Error(error.message || 'Failed to check subscription');
      }

      console.log('Subscription check result:', subscriberData);
      
      if (subscriberData) {
        const subscriptionData = {
          subscribed: subscriberData.subscribed || false,
          subscription_tier: subscriberData.subscription_tier || null,
          subscription_end: subscriberData.subscription_end || null
        };
        
        // Check if subscription status changed from unsubscribed to subscribed
        // Only show toast if there was a recent checkout (to avoid showing on every page refresh)
        const wasUnsubscribed = !subscribed;
        const isNowSubscribed = subscriptionData.subscribed;
        const hasRecentCheckout = localStorage.getItem(`checkout_initiated_${user.id}`);
        
        if (wasUnsubscribed && isNowSubscribed && hasRecentCheckout) {
          console.log('🎉 Subscription status changed from unsubscribed to subscribed!');
          showToast.success('🎉 Premium erfolgreich aktiviert! Du hast jetzt Zugang zu allen Premium-Features.');
          
          // Clean up checkout tracking
          localStorage.removeItem(`checkout_initiated_${user.id}`);
        }
        
        // Update state
        setSubscribed(subscriptionData.subscribed);
        setSubscriptionTier(subscriptionData.subscription_tier);
        setSubscriptionEnd(subscriptionData.subscription_end);
      } else {
        // No subscriber record found - user is not subscribed
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
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

  const createCheckoutSession = async (priceType?: 'monthly' | 'semester', consentGiven?: boolean) => {
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

  // Clean up localStorage checkout tracking for other users
  useEffect(() => {
    if (user?.id) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          // Clean up old checkout tracking for other users
          if (key?.startsWith('checkout_initiated_') && key !== `checkout_initiated_${user.id}`) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Error cleaning up old checkout tracking:', error);
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
      
      // Refresh subscription status
      checkSubscription();
      
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
    
    // Additional check: if user returns to the app and we have checkout tracking, do a one-time refresh
    if (user?.id && !hasCheckoutSuccess && !hasCheckoutCancelled) {
      const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
      if (checkoutInitiated) {
        const checkoutTime = new Date(checkoutInitiated);
        const now = new Date();
        const timeSinceCheckout = now.getTime() - checkoutTime.getTime();
        
        // If checkout was initiated within the last 5 minutes, do a one-time refresh
        if (timeSinceCheckout < 5 * 60 * 1000) {
          console.log('One-time subscription refresh due to recent checkout activity');
          setTimeout(() => {
            checkSubscription();
          }, 2000);
        } else {
          // Clean up old checkout tracking
          localStorage.removeItem(`checkout_initiated_${user.id}`);
        }
      }
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
