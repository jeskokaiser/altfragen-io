import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Campaign = Tables<'campaigns'>;
export type CampaignInsert = Tables<'campaigns', 'Insert'>;
export type CampaignUpdate = Tables<'campaigns', 'Update'>;

export class CampaignService {
  // Fetch all campaigns (admin only)
  static async getAllCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    return data || [];
  }

  // Fetch active campaigns for non-premium users
  static async getActiveCampaigns(): Promise<Campaign[]> {
    console.log('CampaignService: Fetching active campaigns...');
    
    // First, let's check if there are any campaigns at all
    const { data: allCampaigns, error: allError } = await supabase
      .from('campaigns')
      .select('*');
    
    console.log('CampaignService: All campaigns in database:', allCampaigns);
    
    // Simplified query to debug
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
      
    // Filter in JavaScript for now to debug
    const now = new Date();
    const filteredData = data?.filter(campaign => {
      // Include if no end_date or end_date is in the future
      if (!campaign.end_date) return true;
      return new Date(campaign.end_date) > now;
    }) || [];

    if (error) {
      console.error('Error fetching active campaigns:', error);
      throw error;
    }

    console.log('CampaignService: Active campaigns query result:', data);
    console.log('CampaignService: Filtered campaigns:', filteredData);
    return filteredData;
  }

  // Create a new campaign
  static async createCampaign(campaign: Omit<CampaignInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Campaign> {
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

    return data;
  }

  // Update an existing campaign
  static async updateCampaign(id: string, updates: CampaignUpdate): Promise<Campaign> {
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

    return data;
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
  static async toggleCampaignStatus(id: string, active: boolean): Promise<Campaign> {
    return this.updateCampaign(id, { active });
  }
} 