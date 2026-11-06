import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { toAISources, withoutErrorText } from './AIAnswerCommentaryService';

describe('toAISources', () => {
  it('keeps http(s) links and falls back to the URL as title', () => {
    expect(
      toAISources([
        { id: 1, title: 'AWMF', url: 'https://register.awmf.org/' },
        { url: 'http://example.org/a' },
      ]),
    ).toEqual([
      { id: 1, title: 'AWMF', url: 'https://register.awmf.org/' },
      { id: undefined, title: 'http://example.org/a', url: 'http://example.org/a' },
    ]);
  });

  it('drops anything that could not be a safe link', () => {
    expect(
      toAISources([
        { title: 'Skript', url: 'javascript:alert(1)' },
        { title: 'ohne URL' },
        'kein Objekt',
        null,
      ]),
    ).toEqual([]);
    expect(toAISources(null)).toEqual([]);
    expect(toAISources({ url: 'https://example.org/' })).toEqual([]);
  });
});

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
