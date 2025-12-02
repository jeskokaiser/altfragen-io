import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Check, Loader2, Brain, Tag, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { showToast } from '@/utils/toast';

interface SubscriptionCardProps {
  onSubscribeClick?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ onSubscribeClick }) => {
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
      
      // Show prompt if checkout was within the last 5 minutes and user is not subscribed
      if (timeSinceCheckout < 5 * 60 * 1000) {
        setShowCheckoutPrompt(true);
        
        // Auto-refresh subscription status once
        setTimeout(() => {
          handleRefreshStatus();
        }, 1000);
      } else {
        // Clean up old checkout tracking
        localStorage.removeItem(`checkout_initiated_${user.id}`);
      }
    }
  }, [user?.id, subscribed]);

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await checkSubscription();
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
    <Card className="p-2 border-none">
      <h4 className="text-lg font-semibold mb-4">
        {subscribed ? 'Premium aktiv - Vielen Dank!' : 'Jetzt durchstarten!'}
      </h4>
      
      {/* Checkout prompt for users who recently purchased */}
      {showCheckoutPrompt && !subscribed && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Premium-Status wird verarbeitet
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                Der Status wird automatisch aktualisiert, sobald die Zahlung verarbeitet wurde.
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
      
      <div className="space-y-2">
        {subscribed ? (
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-2">
              <Button onClick={openCustomerPortal} variant="outline" className="flex-1">
                Abonnement verwalten
              </Button>
              <Button 
                onClick={() => window.location.href = 'mailto:premium@altfragen.io?subject=Premium Support Anfrage'}
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
            <Button 
              onClick={onSubscribeClick || (() => createCheckoutSession('monthly'))} 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-full"
            >
              Auf Premium upgraden
            </Button>
            <div className="text-center text-[11px] text-muted-foreground">
              Ab 9 €/Monat oder 29 €/Semester (6 Monate), jeweils mit automatischer Verlängerung.
            </div>
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
