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
    <div role="status" className="fixed right-4 top-20 z-toast max-w-sm">
      <Card className="border-warning-border bg-warning-subtle p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
              <Clock aria-hidden="true" className="h-4 w-4 text-warning-strong" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-warning-strong">
                Premium wird verarbeitet
              </h4>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-warning-strong hover:bg-card"
                aria-label="Hinweis schließen"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-warning-strong mb-2">
              Deine Zahlung wird verarbeitet. Der Status wird automatisch aktualisiert.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleRefreshStatus}
                size="sm"
                variant="outline"
                disabled={isRefreshing}
                className="h-8 border-warning-border text-xs text-warning-strong"
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
