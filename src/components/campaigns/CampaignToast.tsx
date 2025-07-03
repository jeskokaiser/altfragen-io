import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CampaignService, Campaign } from '@/services/CampaignService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CampaignToast: React.FC = () => {
  const { subscribed, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [shown, setShown] = useState<string[]>([]);

  useEffect(() => {
    if (!subscribed && !subscriptionLoading) {
      showCampaignToasts();
    }
  }, [subscribed, subscriptionLoading]);

  const showCampaignToasts = async () => {
    try {
      const campaigns = await CampaignService.getActiveCampaigns();
      const toastCampaigns = campaigns.filter(c => c.display_type === 'toast');
      
      // Get shown campaigns from sessionStorage (reset per session)
      const shownInSession = sessionStorage.getItem('shownCampaignToasts');
      const shownIds = shownInSession ? JSON.parse(shownInSession) : [];
      
      // Show campaigns that haven't been shown in this session
      toastCampaigns.forEach((campaign) => {
        if (!shownIds.includes(campaign.id)) {
          setTimeout(() => {
            showCampaignToast(campaign);
            // Mark as shown
            const newShownIds = [...shownIds, campaign.id];
            sessionStorage.setItem('shownCampaignToasts', JSON.stringify(newShownIds));
          }, 3000); // Show after 3 seconds
        }
      });
    } catch (error) {
      console.error('Error showing campaign toasts:', error);
    }
  };

  const showCampaignToast = (campaign: Campaign) => {
    const handleCopyCode = () => {
      if (campaign.code) {
        navigator.clipboard.writeText(campaign.code);
        toast.success('Code kopiert!');
      }
    };

    const handleNavigate = () => {
      navigate('/subscription');
    };

    toast(
      <div className="space-y-3">
        <div>
          <p className="font-semibold">{campaign.title}</p>
          <p className="text-sm text-muted-foreground">{campaign.description}</p>
        </div>
        
        {campaign.code && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCode}
            className="flex items-center gap-1 w-full"
          >
            <Tag className="h-3 w-3" />
            Code: {campaign.code}
          </Button>
        )}
        
        <Button
          size="sm"
          onClick={handleNavigate}
          className="w-full"
        >
          Jetzt {campaign.discount_percentage ? `${campaign.discount_percentage}%` : ''} sparen
        </Button>
      </div>,
      {
        duration: 10000, // Show for 10 seconds
        action: {
          label: 'Schließen',
          onClick: () => {}
        }
      }
    );
  };

  return null;
};

export default CampaignToast; 