
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
  createCheckoutSession: () => Promise<void>;
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
      console.log('Checking subscription status for user:', user.id);
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
        setSubscribed(data.subscribed || false);
        setSubscriptionTier(data.subscription_tier || null);
        setSubscriptionEnd(data.subscription_end || null);
      } else {
        // Handle case where data is null/undefined
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast.error(`Failed to check subscription status: ${errorMessage}`);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async () => {
    if (!user) {
      showToast.error('Please log in to subscribe');
      return;
    }

    try {
      console.log('Creating checkout session for user:', user.id);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No valid session found');
      }

      console.log('Invoking create-checkout function');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
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
      showToast.error(`Failed to start checkout process: ${errorMessage}`);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      showToast.error('Please log in to manage subscription');
      return;
    }

    try {
      console.log('Opening customer portal for user:', user.id);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No valid session found');
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Customer portal error details:', error);
        throw new Error(error.message || 'Failed to open customer portal');
      }

      console.log('Customer portal session created:', data);
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast.error(`Failed to open subscription management: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Check for successful checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'success') {
      showToast.success('Subscription activated successfully!');
      // Remove the checkout parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Refresh subscription status after a short delay
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (urlParams.get('checkout') === 'cancelled') {
      showToast.info('Checkout was cancelled');
      // Remove the checkout parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

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
