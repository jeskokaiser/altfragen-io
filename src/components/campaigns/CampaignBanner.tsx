import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CampaignService, Campaign } from '@/services/CampaignService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Tag, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CampaignBanner: React.FC = () => {
  const { subscribed, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscribed && !subscriptionLoading) {
      loadCampaigns();
    }
  }, [subscribed, subscriptionLoading]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      console.log('CampaignBanner: Loading campaigns for non-subscribed user');
      const activeCampaigns = await CampaignService.getActiveCampaigns();
      console.log('CampaignBanner: Active campaigns loaded:', activeCampaigns);
      setCampaigns(activeCampaigns);
      
      // Restore dismissed campaigns from localStorage
      const dismissedFromStorage = localStorage.getItem('dismissedCampaigns');
      if (dismissedFromStorage) {
        setDismissed(JSON.parse(dismissedFromStorage));
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (campaignId: string) => {
    const newDismissed = [...dismissed, campaignId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedCampaigns', JSON.stringify(newDismissed));
    
    // Move to next campaign if available
    if (currentCampaignIndex < visibleCampaigns.length - 1) {
      setCurrentCampaignIndex(currentCampaignIndex + 1);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code kopiert!');
  };

  const handleCTAClick = () => {
    navigate('/subscription');
  };

  // Filter out dismissed campaigns
  const visibleCampaigns = campaigns.filter(c => !dismissed.includes(c.id));
  
  console.log('CampaignBanner: Component state', { 
    subscribed, 
    subscriptionLoading,
    loading, 
    campaignsCount: campaigns.length,
    visibleCampaignsCount: visibleCampaigns.length 
  });
  
  // Don't render while subscription is loading, if user is subscribed, or if no campaigns
  if (subscriptionLoading || subscribed || loading || visibleCampaigns.length === 0) {
    return null;
  }

  const currentCampaign = visibleCampaigns[currentCampaignIndex];
  
  if (!currentCampaign) {
    return null;
  }

  // Calculate time remaining if end date exists
  const getTimeRemaining = () => {
    if (!currentCampaign.end_date) return null;
    
    const now = new Date();
    const end = new Date(currentCampaign.end_date);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `Noch ${days} Tag${days > 1 ? 'e' : ''}`;
    } else {
      return `Noch ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
    }
  };

  const timeRemaining = getTimeRemaining();

  if (currentCampaign.display_type === 'banner') {
    return (
      <div className="relative bg-gradient-to-r from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 border-b border-blue-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-blue-800 dark:text-blue-100">
                    {currentCampaign.title}
                  </span>
                  <span className="text-blue-700 dark:text-blue-200">
                    {currentCampaign.description}
                  </span>
                  {currentCampaign.discount_percentage && (
                    <Badge className="ml-2 bg-blue-500 text-white font-semibold px-2 py-1 shadow-sm dark:bg-blue-600 dark:text-blue-50">
                      -{currentCampaign.discount_percentage}%
                    </Badge>
                  )}
                  {timeRemaining && (
                    <Badge variant="outline" className="ml-2 bg-blue-100/80 text-blue-800 border-blue-400 flex items-center gap-1 dark:bg-blue-900/60 dark:text-blue-100 dark:border-blue-600">
                      <Clock className="h-3 w-3 text-blue-500 dark:text-blue-300" />
                      {timeRemaining}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentCampaign.code && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(currentCampaign.code!)}
                    className="bg-blue-200/60 hover:bg-blue-200/90 text-blue-800 border-blue-300 flex items-center gap-1 dark:bg-blue-800/60 dark:hover:bg-blue-800/80 dark:text-blue-100 dark:border-blue-600"
                  >
                    <Tag className="h-3 w-3 text-blue-500 dark:text-blue-300" />
                    {currentCampaign.code}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={handleCTAClick}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-1 shadow dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-blue-50"
                >
                  Jetzt sparen
                  <ChevronRight className="h-3 w-3 text-white dark:text-blue-100" />
                </Button>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDismiss(currentCampaign.id)}
              className="h-8 w-8 p-0 text-blue-300 hover:text-blue-600 hover:bg-blue-100/60 dark:text-blue-500 dark:hover:text-blue-200 dark:hover:bg-blue-900/40"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For modal display type, render as a card
  if (currentCampaign.display_type === 'modal') {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDismiss(currentCampaign.id)}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{currentCampaign.title}</h3>
              <p className="text-muted-foreground mt-1">{currentCampaign.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {currentCampaign.discount_percentage && (
                <Badge variant="secondary" className="text-lg py-1">
                  -{currentCampaign.discount_percentage}% Rabatt
                </Badge>
              )}
              {timeRemaining && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRemaining}
                </Badge>
              )}
            </div>
            
            {currentCampaign.code && (
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-semibold">{currentCampaign.code}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(currentCampaign.code!)}
                >
                  Kopieren
                </Button>
              </div>
            )}
            
            <Button
              className="w-full"
              onClick={handleCTAClick}
            >
              Zum Premium-Abo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Toast display type is handled separately
  return null;
};

export default CampaignBanner; 