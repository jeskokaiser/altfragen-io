import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X, Clock } from 'lucide-react';

const CheckoutStatusNotification: React.FC = () => {
  const { user } = useAuth();
  const { subscribed, checkSubscription, loading } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id || subscribed || loading) return;

    const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
    if (checkoutInitiated) {
      const initTime = new Date(checkoutInitiated);
      const now = new Date();
      const timeSinceCheckout = now.getTime() - initTime.getTime();

      // Show notification if checkout was within the last 5 minutes
      if (timeSinceCheckout < 5 * 60 * 1000) {
        setIsVisible(true);
      } else {
        // Clean up old checkout tracking
        localStorage.removeItem(`checkout_initiated_${user.id}`);
      }
    }
  }, [user?.id, subscribed, loading]);

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await checkSubscription();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (user?.id) {
      localStorage.removeItem(`checkout_initiated_${user.id}`);
    }
  };

  if (!isVisible || subscribed || loading) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="p-4 shadow-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Premium wird verarbeitet
              </h4>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
              Deine Zahlung wird verarbeitet. Der Status wird automatisch aktualisiert.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshStatus}
                size="sm"
                variant="outline"
                disabled={isRefreshing}
                className="text-xs h-7 bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Status prüfen
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CheckoutStatusNotification; 