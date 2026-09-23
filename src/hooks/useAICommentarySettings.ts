import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_AI_COMMENTARY_SETTINGS,
  fetchAICommentarySettings,
} from '@/services/AICommentarySettingsService';

/**
 * The app-wide AI commentary settings, shared by every screen that reads them.
 *
 * One query key means one request however many components mount at once --
 * the session list and the exam list often render together, and used to fetch
 * the same row twice. Until the row arrives, and if it cannot be read, the
 * defaults stand in.
 */
export const useAICommentarySettings = () => {
  const query = useQuery({
    queryKey: ['ai-commentary-settings'],
    queryFn: fetchAICommentarySettings,
  });

  return {
    settings: query.data ?? DEFAULT_AI_COMMENTARY_SETTINGS,
    isLoading: query.isLoading,
  };
};
