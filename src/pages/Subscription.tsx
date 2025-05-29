
import React from 'react';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

const Subscription = () => {
  const { subscribed } = useSubscription();

  const features = [
    { name: 'Basic question access', free: true, premium: true },
    { name: 'Limited daily questions', free: true, premium: false },
    { name: 'Unlimited questions', free: false, premium: true },
    { name: 'AI answer explanations', free: false, premium: true },
    { name: 'Advanced analytics', free: false, premium: true },
    { name: 'Progress tracking', free: true, premium: true },
    { name: 'Priority support', free: false, premium: true },
    { name: 'Early access to new features', free: false, premium: true },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Free</h3>
            <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
            <p className="text-sm text-muted-foreground">Perfect for getting started</p>
          </div>
          
          <div className="space-y-3 mt-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                {feature.free ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm ${!feature.free ? 'text-gray-400' : ''}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Premium Plan */}
        <Card className={`p-6 relative ${subscribed ? 'border-2 border-yellow-400' : ''}`}>
          {subscribed && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <PremiumBadge />
            </div>
          )}
          
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Premium</h3>
            <div className="text-3xl font-bold">$9.99<span className="text-sm font-normal">/month</span></div>
            <p className="text-sm text-muted-foreground">Full access to all features</p>
          </div>
          
          <div className="space-y-3 mt-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                {feature.premium ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm ${!feature.premium ? 'text-gray-400' : ''}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="max-w-md mx-auto">
        <SubscriptionCard />
      </div>
    </div>
  );
};

export default Subscription;
