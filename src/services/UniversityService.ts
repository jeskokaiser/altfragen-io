
import { supabase } from '@/integrations/supabase/client';
import { University } from '@/types/models/University';
import { AppError, handleApiError } from '@/utils/errorHandler';

/**
 * Fetches all universities from the database
 */
export const fetchUniversities = async (): Promise<University[]> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, email_domain, created_at, updated_at');

    if (error) {
      throw new AppError(`Failed to fetch universities: ${error.message}`, error);
    }

    return data || [];
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch universities');
  }
};

/**
 * Gets a university by its email domain
 */
export const getUniversityByEmailDomain = async (emailDomain: string): Promise<University | null> => {
  try {
    const domain = emailDomain.includes('@') ? emailDomain.split('@')[1] : emailDomain;
    
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, email_domain, created_at, updated_at')
      .eq('email_domain', domain)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to get university: ${error.message}`, error);
    }

    return data;
  } catch (error) {
    throw handleApiError(error, 'Failed to get university by email domain');
  }
};
