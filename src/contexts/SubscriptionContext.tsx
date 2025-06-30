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
  createCheckoutSession: (priceType?: 'monthly' | 'weekly') => Promise<void>;
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

  const createCheckoutSession = async (priceType?: 'monthly' | 'weekly') => {
    if (!user) {
      showToast.error('Bitte melde dich an, um ein Abonnement zu erstellen');
      return;
    }

    try {
      console.log('Creating checkout session for user:', user.id, 'priceType:', priceType);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No valid session found');
      }

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
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      showToast.error('Bitte melde dich an, um dein Abonnement zu verwalten');
      return;
    }

    try {
      console.log('Opening customer portal for user:', user.id);
      
      // Direct redirect to Stripe customer portal
      const portalUrl = 'https://billing.stripe.com/p/login/eVqbJ0aDy6gQ7Yi6ykcAo00';
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
      showToast.success('Kundenportal wurde geöffnet');
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

  // Check for successful checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'success') {
      showToast.success('Abonnement erfolgreich aktiviert!');
      // Remove the checkout parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Refresh subscription status after a short delay
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (urlParams.get('checkout') === 'cancelled') {
      showToast.info('Der Checkout wurde abgebrochen');
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
