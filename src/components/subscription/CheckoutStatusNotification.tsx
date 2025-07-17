import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X, Clock, CheckCircle } from 'lucide-react';
import { showToast } from '@/utils/toast';

const CheckoutStatusNotification: React.FC = () => {
  const { user } = useAuth();
  const { subscribed, checkSubscription, loading } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkoutTime, setCheckoutTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!user?.id || subscribed || loading) return;

    const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
    if (checkoutInitiated) {
      const initTime = new Date(checkoutInitiated);
      const now = new Date();
      const timeSinceCheckout = now.getTime() - initTime.getTime();

      // Show notification if checkout was within the last 15 minutes
      if (timeSinceCheckout < 15 * 60 * 1000) {
        setIsVisible(true);
        setCheckoutTime(initTime);
      } else {
        // Clean up old checkout tracking
        localStorage.removeItem(`checkout_initiated_${user.id}`);
      }
    }
  }, [user?.id, subscribed, loading]);

  // Update time remaining counter
  useEffect(() => {
    if (!isVisible || !checkoutTime) return;

    const updateTimer = () => {
      const now = new Date();
      const timeSinceCheckout = now.getTime() - checkoutTime.getTime();
      const maxWaitTime = 10 * 60 * 1000; // 10 minutes
      const remaining = Math.max(0, maxWaitTime - timeSinceCheckout);

      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining('');
        // Auto-dismiss after 10 minutes
        handleDismiss();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isVisible, checkoutTime]);

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await checkSubscription(true);
      
      // Show toast based on result
      setTimeout(() => {
        if (!subscribed) {
          showToast.info('Status wird noch verarbeitet. Zahlungen können bis zu 10 Minuten dauern.');
        }
      }, 500);
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isVisible || subscribed) return;

    const autoRefreshInterval = setInterval(() => {
      handleRefreshStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [isVisible, subscribed]);

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
              Deine Zahlung wird von Stripe verarbeitet. Dies kann bis zu 10 Minuten dauern.
            </p>
            
            {timeRemaining && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                Max. Wartezeit: {timeRemaining}
              </div>
            )}
            
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