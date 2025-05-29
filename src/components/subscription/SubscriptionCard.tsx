
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Check, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscription status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${subscribed ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`h-5 w-5 ${subscribed ? 'text-yellow-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold">
              {subscribed ? 'Premium Subscription' : 'Premium Features'}
            </h3>
            {subscribed && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Active
              </Badge>
            )}
          </div>
          
          {subscribed ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current Plan: <strong>{subscriptionTier || 'Premium'}</strong>
              </p>
              {subscriptionEnd && (
                <p className="text-sm text-muted-foreground">
                  Renews on: {new Date(subscriptionEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Unlock premium features for just $9.99/month
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unlimited question access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>AI-powered answer explanations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Advanced progress analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        {subscribed ? (
          <Button onClick={openCustomerPortal} variant="outline">
            Manage Subscription
          </Button>
        ) : (
          <Button onClick={createCheckoutSession} className="bg-yellow-600 hover:bg-yellow-700">
            Upgrade to Premium
          </Button>
        )}
        <Button onClick={checkSubscription} variant="ghost" size="sm">
          Refresh Status
        </Button>
      </div>
    </Card>
  );
};

export default SubscriptionCard;
