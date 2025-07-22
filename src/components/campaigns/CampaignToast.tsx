import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CampaignService } from '@/services/CampaignService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tag, AlertTriangle, Info, MessageSquare, ExternalLink, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  EnhancedCampaign, 
  CAMPAIGN_STYLING,
  StylingVariant,
  ActionType,
  CampaignType 
} from '@/types/Campaign';

const CampaignToast: React.FC = () => {
  const { subscribed, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [shown, setShown] = useState<string[]>([]);

  useEffect(() => {
    if (!subscriptionLoading) {
      showCampaignToasts();
    }
  }, [subscribed, subscriptionLoading]);

  const showCampaignToasts = async () => {
    try {
      // Use the new method that handles audience targeting
      const campaigns = await CampaignService.getCampaignsForUser(subscribed ?? false);
      const toastCampaigns = campaigns.filter(c => c.display_type === 'toast');
      
      // Get shown campaigns from sessionStorage (reset per session)
      const shownInSession = sessionStorage.getItem('shownCampaignToasts');
      const shownIds = shownInSession ? JSON.parse(shownInSession) : [];
      
      // Show campaigns that haven't been shown in this session
      toastCampaigns.forEach((campaign, index) => {
        if (!shownIds.includes(campaign.id)) {
          setTimeout(() => {
            showCampaignToast(campaign);
            // Mark as shown
            const newShownIds = [...shownIds, campaign.id];
            sessionStorage.setItem('shownCampaignToasts', JSON.stringify(newShownIds));
          }, 3000 + (index * 1500)); // Stagger toasts by 1.5 seconds
        }
      });
    } catch (error) {
      console.error('Error showing campaign toasts:', error);
    }
  };

  const handleActionClick = (campaign: EnhancedCampaign) => {
    const actionType = campaign.action_type as ActionType;
    
    switch (actionType) {
      case 'subscription':
        navigate('/subscription');
        break;
      case 'navigate':
        if (campaign.action_url) {
          navigate(campaign.action_url);
        }
        break;
      case 'external_link':
        if (campaign.action_url) {
          window.open(campaign.action_url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'feedback_form':
        // Could show a feedback modal or navigate to feedback page
        toast.info('Feedback-Formular wird geladen...');
        // TODO: Implement feedback form logic
        break;
      case 'dismiss_only':
        // No action needed, toast will auto-dismiss
        break;
      default:
        // Default fallback to subscription page
        navigate('/subscription');
    }
  };

  const getCampaignIcon = (campaignType: CampaignType) => {
    switch (campaignType) {
      case 'maintenance':
        return AlertTriangle;
      case 'feedback':
        return MessageSquare;
      case 'announcement':
        return Info;
      case 'discount':
      default:
        return Tag;
    }
  };

  const getActionButtonText = (campaign: EnhancedCampaign): string => {
    if (campaign.action_text) {
      return campaign.action_text;
    }
    
    const actionType = campaign.action_type as ActionType;
    const campaignType = campaign.campaign_type as CampaignType;
    
    switch (actionType) {
      case 'subscription':
        return campaignType === 'discount' ? 'Sparen' : 'Premium';
      case 'navigate':
        return 'Ansehen';
      case 'external_link':
        return 'Öffnen';
      case 'feedback_form':
        return 'Feedback';
      case 'dismiss_only':
        return 'OK';
      default:
        return 'Mehr';
    }
  };

  const getActionButtonIcon = (campaign: EnhancedCampaign) => {
    const actionType = campaign.action_type as ActionType;
    
    switch (actionType) {
      case 'external_link':
        return ExternalLink;
      case 'feedback_form':
        return MessageSquare;
      default:
        return ChevronRight;
    }
  };

  const showCampaignToast = (campaign: EnhancedCampaign) => {
    const stylingVariant = (campaign.styling_variant as StylingVariant) || 'default';
    const styling = CAMPAIGN_STYLING[stylingVariant];
    const IconComponent = getCampaignIcon(campaign.campaign_type as CampaignType);
    const ActionIcon = getActionButtonIcon(campaign);

    // Custom toast content with campaign styling
    const ToastContent = () => (
      <div className="flex items-start gap-3 pr-4">
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className={`h-5 w-5 ${styling.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{campaign.title}</div>
          <div className="text-sm opacity-90 mt-1">{campaign.description}</div>
          {campaign.discount_percentage && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styling.badgeClass}`}>
                -{campaign.discount_percentage}% Rabatt
              </span>
            </div>
          )}
          {campaign.code && (
            <div className="mt-2">
              <span className="text-xs opacity-75">Code: </span>
              <span className="font-mono text-xs">{campaign.code}</span>
            </div>
          )}
        </div>
      </div>
    );

    // Show toast with appropriate styling and actions
    const toastId = toast.custom(
      <div className={`p-4 rounded-lg shadow-lg ${styling.containerClass} border max-w-md`}>
        <ToastContent />
        {campaign.action_type !== 'dismiss_only' && (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                handleActionClick(campaign);
                toast.dismiss(toastId);
              }}
              className={`${styling.buttonClass} text-xs px-3 py-1 h-8`}
            >
              {getActionButtonText(campaign)}
              <ActionIcon className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>,
      {
        duration: campaign.action_type === 'dismiss_only' ? 5000 : 10000, // Auto-dismiss faster for info-only toasts
        position: 'top-right',
        style: {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        },
      }
    );

    // Copy code to clipboard if user clicks on it
    if (campaign.code) {
      const codeSpan = document.querySelector(`[data-campaign-id="${campaign.id}"] .font-mono`);
      if (codeSpan) {
        codeSpan.style.cursor = 'pointer';
        codeSpan.onclick = () => {
          navigator.clipboard.writeText(campaign.code!);
          toast.success('Code kopiert!', { duration: 2000 });
        };
      }
    }
  };

  return null; // This component only manages toast display logic
};

export default CampaignToast; 