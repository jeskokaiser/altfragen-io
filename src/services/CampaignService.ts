import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { 
  CampaignRow, 
  CampaignInsert, 
  CampaignUpdate, 
  EnhancedCampaign,
  CampaignFormData 
} from '@/types/Campaign';

// Legacy exports for backward compatibility
export type Campaign = CampaignRow;
export type CampaignInsertLegacy = CampaignInsert;
export type CampaignUpdateLegacy = CampaignUpdate;

export class CampaignService {
  // Fetch all campaigns (admin only)
  static async getAllCampaigns(): Promise<EnhancedCampaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    return data as EnhancedCampaign[] || [];
  }

  // Fetch campaigns for a specific user based on their subscription status
  static async getCampaignsForUser(isSubscribed: boolean): Promise<EnhancedCampaign[]> {
    console.log('CampaignService: Fetching campaigns for user, subscribed:', isSubscribed);
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    const now = new Date();
    const filteredData = (data as EnhancedCampaign[])?.filter(campaign => {
      // Check if campaign should be shown to this user based on subscription status
      if (isSubscribed && !campaign.show_to_premium) {
        return false;
      }
      
      // Include if no end_date or end_date is in the future
      if (campaign.end_date && new Date(campaign.end_date) <= now) {
        return false;
      }
      
      // Include if no start_date or start_date is in the past
      if (campaign.start_date && new Date(campaign.start_date) > now) {
        return false;
      }
      
      return true;
    }) || [];

    console.log('CampaignService: Filtered campaigns for user:', filteredData);
    return filteredData;
  }

  // Legacy method - maintained for backward compatibility
  static async getActiveCampaigns(): Promise<EnhancedCampaign[]> {
    console.log('CampaignService: Using legacy getActiveCampaigns method');
    return this.getCampaignsForUser(false);
  }

  // Get campaigns by type
  static async getCampaignsByType(campaignType: string, isSubscribed: boolean = false): Promise<EnhancedCampaign[]> {
    const allCampaigns = await this.getCampaignsForUser(isSubscribed);
    return allCampaigns.filter(campaign => campaign.campaign_type === campaignType);
  }

  // Create a new campaign with enhanced data
  static async createEnhancedCampaign(campaignData: CampaignFormData): Promise<EnhancedCampaign> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const insertData: Partial<CampaignInsert> = {
      title: campaignData.title,
      description: campaignData.description,
      campaign_type: campaignData.campaign_type,
      show_to_premium: campaignData.show_to_premium,
      action_type: campaignData.action_type,
      action_url: campaignData.action_url || null,
      action_text: campaignData.action_text || null,
      styling_variant: campaignData.styling_variant,
      code: campaignData.code || null,
      discount_percentage: campaignData.discount_percentage || null,
      active: campaignData.active,
      start_date: campaignData.start_date || null,
      end_date: campaignData.end_date || null,
      priority: campaignData.priority,
      display_type: campaignData.display_type,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }

    return data as EnhancedCampaign;
  }

  // Legacy create method - maintained for backward compatibility
  static async createCampaign(campaign: Omit<CampaignInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<EnhancedCampaign> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }

    return data as EnhancedCampaign;
  }

  // Update an existing campaign
  static async updateCampaign(id: string, updates: Partial<CampaignUpdate>): Promise<EnhancedCampaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }

    return data as EnhancedCampaign;
  }

  // Update campaign with enhanced data
  static async updateEnhancedCampaign(id: string, campaignData: CampaignFormData): Promise<EnhancedCampaign> {
    const updateData: Partial<CampaignUpdate> = {
      title: campaignData.title,
      description: campaignData.description,
      campaign_type: campaignData.campaign_type,
      show_to_premium: campaignData.show_to_premium,
      action_type: campaignData.action_type,
      action_url: campaignData.action_url || null,
      action_text: campaignData.action_text || null,
      styling_variant: campaignData.styling_variant,
      code: campaignData.code || null,
      discount_percentage: campaignData.discount_percentage || null,
      active: campaignData.active,
      start_date: campaignData.start_date || null,
      end_date: campaignData.end_date || null,
      priority: campaignData.priority,
      display_type: campaignData.display_type,
      updated_at: new Date().toISOString()
    };

    return this.updateCampaign(id, updateData);
  }

  // Delete a campaign
  static async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  // Toggle campaign active status
  static async toggleCampaignStatus(id: string, active: boolean): Promise<EnhancedCampaign> {
    return this.updateCampaign(id, { active });
  }

  // Get maintenance campaigns for system status
  static async getMaintenanceCampaigns(isSubscribed: boolean = false): Promise<EnhancedCampaign[]> {
    return this.getCampaignsByType('maintenance', isSubscribed);
  }

  // Get feedback campaigns
  static async getFeedbackCampaigns(isSubscribed: boolean = false): Promise<EnhancedCampaign[]> {
    return this.getCampaignsByType('feedback', isSubscribed);
  }

  // Get announcement campaigns
  static async getAnnouncementCampaigns(isSubscribed: boolean = false): Promise<EnhancedCampaign[]> {
    return this.getCampaignsByType('announcement', isSubscribed);
  }
} 