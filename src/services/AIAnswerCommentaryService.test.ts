import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { withoutErrorText } from './AIAnswerCommentaryService';

describe('withoutErrorText', () => {
  it('treats a stored "Fehler: ..." as a missing comment and keeps everything else', () => {
    const sources = [{ id: 1, title: 'AWMF', url: 'https://register.awmf.org/' }];
    expect(
      withoutErrorText({
        perplexity_general_comment: 'Fehler: Perplexity API error: 400',
        perplexity_comment_a: 'Fehler: Perplexity API error: 400',
        chatgpt_general_comment: 'Der Fehler liegt in Antwort B.',
        perplexity_sources: sources,
        processing_status: 'failed',
      }),
    ).toEqual({
      perplexity_general_comment: null,
      perplexity_comment_a: null,
      chatgpt_general_comment: 'Der Fehler liegt in Antwort B.',
      perplexity_sources: sources,
      processing_status: 'failed',
    });
  });
});
