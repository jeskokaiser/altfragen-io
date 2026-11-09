import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Base campaign type from Supabase
export type CampaignRow = Tables<'campaigns'>;
export type CampaignInsert = TablesInsert<'campaigns'>;
export type CampaignUpdate = TablesUpdate<'campaigns'>;

// Enhanced campaign types with proper enums
export type CampaignType = 'discount' | 'maintenance' | 'feedback' | 'announcement';

export type ActionType =
  | 'subscription' // Navigate to subscription page
  | 'navigate' // Navigate to internal route
  | 'external_link' // Open external URL
  | 'dismiss_only' // Only dismiss button, no action
  | 'feedback_form'; // Show feedback form

export type StylingVariant =
  | 'default' // Blue theme (current default)
  | 'warning' // Yellow/orange for maintenance
  | 'info' // Light blue for announcements
  | 'success' // Green for positive messages
  | 'error'; // Red for critical notices

export interface EnhancedCampaign extends CampaignRow {
  show_to_premium: boolean;
  campaign_type: CampaignType;
  action_type: ActionType;
  action_url: string | null;
  action_text: string | null;
  styling_variant: StylingVariant;
}

export interface CampaignFormData {
  title: string;
  description: string;
  campaign_type: CampaignType;
  show_to_premium: boolean;
  action_type: ActionType;
  action_url?: string | null;
  action_text?: string | null;
  styling_variant: StylingVariant;

  // Optional fields (mainly for discount campaigns)
  code?: string | null;
  discount_percentage?: number | null;

  // Timing and display
  active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  priority: number;
  display_type: 'banner' | 'modal' | 'toast';
}

export interface CampaignStyling {
  containerClass: string;
  badgeClass: string;
  buttonClass: string;
  iconColor: string;
}

// Styling per variant, from design-system tokens (docs/design-system.md). Class names
// stay literal so Tailwind finds them.
export const CAMPAIGN_STYLING: Record<StylingVariant, CampaignStyling> = {
  default: {
    containerClass: 'bg-primary-subtle border-primary/30 text-primary-strong',
    badgeClass: 'bg-primary text-primary-foreground',
    buttonClass: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    iconColor: 'text-primary',
  },
  warning: {
    containerClass: 'bg-warning-subtle border-warning-border text-warning-strong',
    badgeClass: 'bg-warning text-warning-foreground',
    buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/90',
    iconColor: 'text-warning',
  },
  info: {
    containerClass: 'bg-primary-subtle border-primary/30 text-primary-strong',
    badgeClass: 'bg-primary text-primary-foreground',
    buttonClass: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    iconColor: 'text-primary',
  },
  success: {
    containerClass: 'bg-success-subtle border-success-border text-success-strong',
    badgeClass: 'bg-success text-success-foreground',
    buttonClass: 'bg-success text-success-foreground hover:bg-success/90',
    iconColor: 'text-success',
  },
  error: {
    containerClass: 'bg-danger-subtle border-danger-border text-danger-strong',
    badgeClass: 'bg-danger text-danger-foreground',
    buttonClass: 'bg-danger text-danger-foreground hover:bg-danger/90',
    iconColor: 'text-danger',
  },
};
