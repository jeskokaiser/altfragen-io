import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CampaignService } from '@/services/CampaignService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  X,
  Tag,
  Clock,
  ChevronRight,
  AlertTriangle,
  Info,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  EnhancedCampaign,
  CAMPAIGN_STYLING,
  StylingVariant,
  ActionType,
  CampaignType,
} from '@/types/Campaign';

const CampaignBanner: React.FC = () => {
  const { subscribed, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([]);
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionLoading) {
      loadCampaigns();
    }
  }, [subscribed, subscriptionLoading]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      console.log('CampaignBanner: Loading campaigns, user subscribed:', subscribed);

      // Use the new method that handles audience targeting
      const activeCampaigns = await CampaignService.getCampaignsForUser(subscribed ?? false);
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
        // No action needed, just dismiss
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
        return campaignType === 'discount' ? 'Jetzt sparen' : 'Zum Premium-Abo';
      case 'navigate':
        return 'Mehr erfahren';
      case 'external_link':
        return 'Link öffnen';
      case 'feedback_form':
        return 'Feedback geben';
      case 'dismiss_only':
        return 'Verstanden';
      default:
        return 'Mehr erfahren';
    }
  };

  const getActionButtonIcon = (campaign: EnhancedCampaign) => {
    const actionType = campaign.action_type as ActionType;

    switch (actionType) {
      case 'external_link':
        return ExternalLink;
      case 'feedback_form':
        return MessageSquare;
      case 'dismiss_only':
        return X;
      default:
        return ChevronRight;
    }
  };

  // Filter out dismissed campaigns
  const visibleCampaigns = campaigns.filter((c) => !dismissed.includes(c.id));

  console.log('CampaignBanner: Component state', {
    subscribed,
    subscriptionLoading,
    loading,
    campaignsCount: campaigns.length,
    visibleCampaignsCount: visibleCampaigns.length,
  });

  // Don't render while subscription is loading or if no campaigns
  if (subscriptionLoading || loading || visibleCampaigns.length === 0) {
    return null;
  }

  const currentCampaign = visibleCampaigns[currentCampaignIndex];

  if (!currentCampaign) {
    return null;
  }

  // Get styling for the current campaign
  const stylingVariant = (currentCampaign.styling_variant as StylingVariant) || 'default';
  const styling = CAMPAIGN_STYLING[stylingVariant];
  const IconComponent = getCampaignIcon(currentCampaign.campaign_type as CampaignType);
  const ActionIcon = getActionButtonIcon(currentCampaign);

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
      <div className={`relative ${styling.containerClass} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0">
                <IconComponent className={`h-5 w-5 ${styling.iconColor}`} />
              </div>

              <div className="min-w-0 flex-1 basis-48">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-semibold ${
                      stylingVariant === 'default'
                        ? 'text-primary-strong '
                        : stylingVariant === 'warning'
                          ? 'text-warning-strong '
                          : stylingVariant === 'info'
                            ? 'text-primary-strong '
                            : stylingVariant === 'success'
                              ? 'text-success-strong '
                              : stylingVariant === 'error'
                                ? 'text-danger-strong '
                                : 'text-foreground '
                    }`}
                  >
                    {currentCampaign.title}
                  </span>
                  <span
                    className={`${
                      stylingVariant === 'default'
                        ? 'text-primary-strong '
                        : stylingVariant === 'warning'
                          ? 'text-warning-strong '
                          : stylingVariant === 'info'
                            ? 'text-primary-strong '
                            : stylingVariant === 'success'
                              ? 'text-success-strong '
                              : stylingVariant === 'error'
                                ? 'text-danger-strong '
                                : 'text-foreground '
                    }`}
                  >
                    {currentCampaign.description}
                  </span>
                  {currentCampaign.discount_percentage && (
                    <Badge
                      className={`ml-2 ${styling.badgeClass} font-semibold px-2 py-1 shadow-sm`}
                    >
                      -{currentCampaign.discount_percentage}%
                    </Badge>
                  )}
                  {timeRemaining && (
                    <Badge
                      variant="outline"
                      className={`ml-2 flex items-center gap-1 ${
                        stylingVariant === 'default'
                          ? 'bg-primary-subtle/80 text-primary-strong border-primary/40 '
                          : stylingVariant === 'warning'
                            ? 'bg-warning-subtle/80 text-warning-strong border-warning-border '
                            : stylingVariant === 'info'
                              ? 'bg-primary-subtle/80 text-primary-strong border-primary/40 '
                              : stylingVariant === 'success'
                                ? 'bg-success-subtle/80 text-success-strong border-success-border '
                                : stylingVariant === 'error'
                                  ? 'bg-danger-subtle/80 text-danger-strong border-danger-border '
                                  : 'bg-muted/80 text-foreground border-input '
                      }`}
                    >
                      <Clock className={`h-3 w-3 ${styling.iconColor}`} />
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
                    className={`flex items-center gap-1 ${
                      stylingVariant === 'default'
                        ? 'bg-primary-subtle/60 hover:bg-primary-subtle/90 text-primary-strong border-primary/40 '
                        : stylingVariant === 'warning'
                          ? 'bg-warning-subtle/60 hover:bg-warning-subtle/90 text-warning-strong border-warning-border '
                          : stylingVariant === 'info'
                            ? 'bg-primary-subtle/60 hover:bg-primary-subtle/90 text-primary-strong border-primary/40 '
                            : stylingVariant === 'success'
                              ? 'bg-success-subtle/60 hover:bg-success-subtle/90 text-success-strong border-success-border '
                              : stylingVariant === 'error'
                                ? 'bg-danger-subtle/60 hover:bg-danger-subtle/90 text-danger-strong border-danger-border '
                                : 'bg-muted/60 hover:bg-muted/90 text-foreground border-border '
                    }`}
                  >
                    <Tag className={`h-3 w-3 ${styling.iconColor}`} />
                    {currentCampaign.code}
                  </Button>
                )}

                {currentCampaign.action_type !== 'dismiss_only' && (
                  <Button
                    size="sm"
                    onClick={() => handleActionClick(currentCampaign)}
                    className={`${styling.buttonClass} h-auto min-h-8 whitespace-normal text-left font-medium flex items-center gap-1 shadow`}
                  >
                    {getActionButtonText(currentCampaign)}
                    <ActionIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDismiss(currentCampaign.id)}
              aria-label="Hinweis schließen"
              className={`h-8 w-8 shrink-0 p-0 hover:bg-foreground/10 ${
                stylingVariant === 'default'
                  ? 'text-primary hover:text-primary '
                  : stylingVariant === 'warning'
                    ? 'text-warning-strong hover:text-warning-strong '
                    : stylingVariant === 'info'
                      ? 'text-primary hover:text-primary '
                      : stylingVariant === 'success'
                        ? 'text-success hover:text-success '
                        : stylingVariant === 'error'
                          ? 'text-danger hover:text-danger '
                          : 'text-muted-foreground hover:text-muted-foreground '
              }`}
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
      <div className="fixed inset-0 z-dialog flex items-center justify-center bg-foreground/60 p-4 dark:bg-background/80">
        <Card className="max-w-md w-full p-6 relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDismiss(currentCampaign.id)}
            aria-label="Hinweis schließen"
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <IconComponent className={`h-6 w-6 mt-0.5 flex-shrink-0 ${styling.iconColor}`} />
              <div>
                <h3 className="text-xl font-semibold">{currentCampaign.title}</h3>
                <p className="text-muted-foreground mt-1">{currentCampaign.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentCampaign.discount_percentage && (
                <Badge className={`text-lg py-1 ${styling.badgeClass}`}>
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

            {currentCampaign.action_type !== 'dismiss_only' && (
              <Button
                className={`w-full ${styling.buttonClass}`}
                onClick={() => handleActionClick(currentCampaign)}
              >
                {getActionButtonText(currentCampaign)}
                <ActionIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Toast display type is handled separately
  return null;
};

export default CampaignBanner;
