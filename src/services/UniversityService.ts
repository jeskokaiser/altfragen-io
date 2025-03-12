
import { supabase } from '@/integrations/supabase/client';
import { University } from '@/types/models/University';
import { AppError, handleApiError } from '@/utils/errorHandler';

/**
 * Fetches all universities from the database
 * @returns Promise<University[]> A promise that resolves to an array of universities
 */
export const fetchUniversities = async (): Promise<University[]> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

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
 * @param emailDomain The email domain to look up
 * @returns Promise<University | null> A promise that resolves to the university or null if not found
 */
export const getUniversityByEmailDomain = async (emailDomain: string): Promise<University | null> => {
  try {
    // Extract domain from email if full email is provided
    const domain = emailDomain.includes('@') 
      ? emailDomain.split('@')[1] 
      : emailDomain;
    
    const { data, error } = await supabase
      .from('universities')
      .select('*')
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
