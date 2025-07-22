import { Tables } from '@/integrations/supabase/types';

// Base campaign type from Supabase
export type CampaignRow = Tables<'campaigns'>;
export type CampaignInsert = Tables<'campaigns', 'Insert'>;
export type CampaignUpdate = Tables<'campaigns', 'Update'>;

// Enhanced campaign types with proper enums
export type CampaignType = 'discount' | 'maintenance' | 'feedback' | 'announcement';

export type ActionType = 
  | 'subscription'     // Navigate to subscription page
  | 'navigate'         // Navigate to internal route
  | 'external_link'    // Open external URL
  | 'dismiss_only'     // Only dismiss button, no action
  | 'feedback_form';   // Show feedback form

export type StylingVariant = 
  | 'default'          // Blue theme (current default)
  | 'warning'          // Yellow/orange for maintenance
  | 'info'             // Light blue for announcements
  | 'success'          // Green for positive messages
  | 'error';           // Red for critical notices

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

// Default styling configurations for each variant
export const CAMPAIGN_STYLING: Record<StylingVariant, CampaignStyling> = {
  default: {
    containerClass: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 border-blue-200 dark:border-gray-800',
    badgeClass: 'bg-blue-500 text-white dark:bg-blue-600 dark:text-blue-50',
    buttonClass: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-300'
  },
  warning: {
    containerClass: 'bg-gradient-to-r from-yellow-100 to-orange-200 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800',
    badgeClass: 'bg-yellow-500 text-white dark:bg-yellow-600 dark:text-yellow-50',
    buttonClass: 'bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    containerClass: 'bg-gradient-to-r from-cyan-100 to-blue-200 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800',
    badgeClass: 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-cyan-50',
    buttonClass: 'bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400'
  },
  success: {
    containerClass: 'bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
    badgeClass: 'bg-green-500 text-white dark:bg-green-600 dark:text-green-50',
    buttonClass: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  error: {
    containerClass: 'bg-gradient-to-r from-red-100 to-pink-200 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800',
    badgeClass: 'bg-red-500 text-white dark:bg-red-600 dark:text-red-50',
    buttonClass: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
    iconColor: 'text-red-600 dark:text-red-400'
  }
}; 