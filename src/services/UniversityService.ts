import { supabase } from '@/integrations/supabase/client';

/**
 * Owns the `universities` table.
 *
 * A user's university decides which shared questions and public comments they
 * see, so it is set once at sign-up from their email domain and read back from
 * their profile afterwards.
 */

export interface University {
  id: string;
  name: string;
}

export const fetchUniversityName = async (universityId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('universities')
    .select('name')
    .eq('id', universityId)
    .single();

  if (error) throw error;

  return data?.name ?? null;
};

/**
 * The university that owns an email domain, or null.
 *
 * The match is exact. A suffix match was tried once and removed: it put anyone
 * at a subdomain, or at a domain merely ending in the same letters, into a
 * university they do not belong to -- and with it, into that university's
 * shared questions.
 */
export const findUniversityByEmailDomain = async (
  emailDomain: string,
): Promise<University | null> => {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name')
    .eq('email_domain', emailDomain);

  if (error) throw error;

  const [university] = data ?? [];

  return university ? { id: university.id, name: university.name } : null;
};

/** Every university, by name, for the admin pickers. */
export const fetchUniversities = async (): Promise<University[]> => {
  const { data, error } = await supabase.from('universities').select('id, name').order('name');

  if (error) throw error;

  return data ?? [];
};
