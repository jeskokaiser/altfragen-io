import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Check, Loader2, Brain, Tag, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { showToast } from '@/utils/toast';

const SubscriptionCard: React.FC = () => {
  const { 
    subscribed, 
    subscriptionTier, 
    subscriptionEnd, 
    loading, 
    checkSubscription, 
    createCheckoutSession, 
    openCustomerPortal 
  } = useSubscription();
  
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);

  // Check if user recently initiated checkout
  useEffect(() => {
    if (!user?.id || subscribed) return;
    
    const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
    if (checkoutInitiated) {
      const checkoutTime = new Date(checkoutInitiated);
      const now = new Date();
      const timeSinceCheckout = now.getTime() - checkoutTime.getTime();
      
      // Show prompt if checkout was within the last 20 minutes and user is not subscribed
      if (timeSinceCheckout < 20 * 60 * 1000) {
        setShowCheckoutPrompt(true);
        
        // Auto-refresh subscription status
        setTimeout(() => {
          handleRefreshStatus();
        }, 1000);
      }
    }
  }, [user?.id, subscribed]);

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await checkSubscription(true);
      
      // If still not subscribed after refresh, show helpful message
      setTimeout(() => {
        if (!subscribed && showCheckoutPrompt) {
          showToast.info('Status wird noch verarbeitet? Stripe Zahlungen können bis zu 10 Minuten dauern.');
        }
      }, 500);
    } finally {
      setIsRefreshing(false);
    }
  };

  const dismissCheckoutPrompt = () => {
    setShowCheckoutPrompt(false);
    if (user?.id) {
      localStorage.removeItem(`checkout_initiated_${user.id}`);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Lade Abonnement-Status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Checkout prompt for users who recently purchased */}
      {showCheckoutPrompt && !subscribed && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Premium-Status wird verarbeitet
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                Stripe-Zahlungen können bis zu 10 Minuten dauern. Wir prüfen automatisch deinen Status.
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefreshStatus}
                  size="sm"
                  variant="outline"
                  disabled={isRefreshing}
                  className="text-xs h-7 border-amber-300 dark:border-amber-700"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Jetzt prüfen
                </Button>
                <Button
                  onClick={dismissCheckoutPrompt}
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                >
                  Verstanden
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${subscribed ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
          <h3 className="text-lg font-semibold">
            {subscribed ? 'Premium Aktiv' : 'Kostenloses Konto'}
          </h3>
        </div>
        <Button
          onClick={handleRefreshStatus}
          variant="ghost"
          size="sm"
          disabled={isRefreshing || loading}
          className="text-xs h-8 px-2"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Aktualisiere...' : 'Status prüfen'}
        </Button>
      </div>

      <div className="space-y-3">
        {subscribed ? (
          <div className="space-y-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Premium Features verfügbar
                </span>
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  <span>Unbegrenzte KI-Kommentare</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Premium Support verfügbar</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div className="font-medium mb-2">Kostenlose Features:</div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span>10 KI-Kommentare pro Tag</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span>Unbegrenzte Fragenbeantwortung</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white p-3 rounded-lg">
              <div className="text-center">
                <div className="font-semibold text-sm mb-1">🎉 Einführungsangebot</div>
                <div className="text-xs">33% Rabatt für die ersten 500 Nutzer</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2 mt-4">
        {subscribed ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={openCustomerPortal} variant="outline" className="flex-1">
                Abonnement verwalten
              </Button>
              <Button 
                onClick={() => window.open('mailto:premium@altfragen.io?subject=Premium Support Anfrage', '_blank')}
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <Mail className="h-4 w-4" />
                Premium Support
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={() => createCheckoutSession('monthly')} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 w-full">
              🔥 Premium für €5,99/Monat
            </Button>
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                Gerade Premium gekauft? 
              </span>
              <Button 
                onClick={handleRefreshStatus}
                variant="link" 
                size="sm"
                disabled={isRefreshing}
                className="text-xs p-0 ml-1 h-auto underline"
              >
                Status aktualisieren
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SubscriptionCard;
