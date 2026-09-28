import { beforeEach, describe, expect, it, vi } from 'vitest';
import { payloadOf, queriesFor, queueResponse, resetSupabaseDouble } from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import {
  DEFAULT_AI_MODELS,
  DEFAULT_KEYBOARD_BINDINGS,
  createUserPreferences,
  defaultUserPreferences,
  fetchUserPreferences,
  mergePreferences,
  saveUserPreferences,
  toUserPreferences,
} from './UserPreferencesService';

/** A row as production stores it, bindings included in full. */
const storedRow = {
  immediate_feedback: true,
  archived_datasets: ['Anatomie 2023.csv'],
  selected_university_datasets: ['Physiologie WS24'],
  keyboard_bindings: { ...DEFAULT_KEYBOARD_BINDINGS, answerA: 'a' },
  statistics_date_range: { preset: '30days' },
  selected_ai_models: ['chatgpt', 'mistral'],
  enhanced_ai_version: 'gemini',
};

/** The eight bindings a row saved before the difficulty and toggle keys has. */
const originalBindings = {
  answerA: '1',
  answerB: '2',
  answerC: '3',
  answerD: '4',
  answerE: '5',
  confirmAnswer: ' ',
  nextQuestion: ' ',
  showSolution: 's',
};

beforeEach(resetSupabaseDouble);

describe('toUserPreferences', () => {
  it('maps a stored row', () => {
    expect(toUserPreferences(storedRow)).toEqual({
      immediateFeedback: true,
      archivedDatasets: ['Anatomie 2023.csv'],
      selectedUniversityDatasets: ['Physiologie WS24'],
      keyboardBindings: { ...DEFAULT_KEYBOARD_BINDINGS, answerA: 'a' },
      statisticsDateRange: { preset: '30days' },
      selectedAIModels: ['chatgpt', 'mistral'],
      enhancedAIVersion: 'gemini',
    });
  });

  it('gives a binding added after the row was saved its default', () => {
    const { keyboardBindings } = toUserPreferences({
      ...storedRow,
      keyboard_bindings: originalBindings,
    });

    expect(keyboardBindings.difficulty1).toBe('Shift+1');
    expect(keyboardBindings.toggleGemini).toBe('w');
  });

  it('keeps a stored binding over its default', () => {
    const { keyboardBindings } = toUserPreferences({
      ...storedRow,
      keyboard_bindings: { ...originalBindings, showSolution: 'l' },
    });

    expect(keyboardBindings.showSolution).toBe('l');
  });

  it('keeps a stored binding the app no longer knows, so saving writes it back', () => {
    // Rows saved by an earlier version can carry a key like `toggleEnhancedAI`.
    // The old context kept it by spreading the stored object; so does this.
    const { keyboardBindings } = toUserPreferences({
      ...storedRow,
      keyboard_bindings: { ...originalBindings, toggleEnhancedAI: 'e' },
    });

    expect(keyboardBindings).toHaveProperty('toggleEnhancedAI', 'e');
  });

  it('falls back to the default for a binding that is not a string', () => {
    const { keyboardBindings } = toUserPreferences({
      ...storedRow,
      keyboard_bindings: { ...originalBindings, answerB: 7 },
    });

    expect(keyboardBindings.answerB).toBe('2');
  });

  it('keeps an empty model list: the user switched every model off', () => {
    // Users do this. Falling back to the defaults here would switch all five
    // models back on for them at their next visit.
    expect(toUserPreferences({ ...storedRow, selected_ai_models: [] }).selectedAIModels).toEqual(
      [],
    );
  });

  it('falls back to the default models when the column holds no list', () => {
    expect(toUserPreferences({ ...storedRow, selected_ai_models: null }).selectedAIModels).toEqual(
      DEFAULT_AI_MODELS,
    );
    expect(
      toUserPreferences({ ...storedRow, selected_ai_models: { chatgpt: true } }).selectedAIModels,
    ).toEqual(DEFAULT_AI_MODELS);
  });

  it('reads anything but chatgpt or gemini as no enhanced version', () => {
    expect(toUserPreferences({ ...storedRow, enhanced_ai_version: 'none' }).enhancedAIVersion).toBe(
      'none',
    );
    expect(toUserPreferences({ ...storedRow, enhanced_ai_version: null }).enhancedAIVersion).toBe(
      'none',
    );
  });

  it('keeps a custom date range with its bounds', () => {
    const range = { preset: 'custom', start: '2026-01-01', end: '2026-03-31' };

    expect(
      toUserPreferences({ ...storedRow, statistics_date_range: range }).statisticsDateRange,
    ).toEqual(range);
  });

  it('reads a malformed date range as all time', () => {
    for (const statistics_date_range of [null, { preset: 'yesterday' }, 'all']) {
      expect(
        toUserPreferences({ ...storedRow, statistics_date_range }).statisticsDateRange,
      ).toEqual({ preset: 'all' });
    }
  });

  it('reads empty columns as the defaults', () => {
    expect(
      toUserPreferences({
        immediate_feedback: null,
        archived_datasets: null,
        selected_university_datasets: null,
        keyboard_bindings: null,
        statistics_date_range: null,
        selected_ai_models: null,
        enhanced_ai_version: null,
      }),
    ).toEqual(defaultUserPreferences());
  });
});

describe('defaultUserPreferences', () => {
  it('hands out a fresh copy, so one user cannot change the defaults for the next', () => {
    const first = defaultUserPreferences();
    first.selectedAIModels.pop();
    first.keyboardBindings.answerA = 'x';

    const second = defaultUserPreferences();
    expect(second.selectedAIModels).toEqual(DEFAULT_AI_MODELS);
    expect(second.keyboardBindings.answerA).toBe('1');
  });
});

describe('mergePreferences', () => {
  const current = toUserPreferences(storedRow);

  it('keeps every field the change leaves out', () => {
    expect(mergePreferences(current, { enhancedAIVersion: 'none' })).toEqual({
      ...current,
      enhancedAIVersion: 'none',
    });
  });

  it('applies false and an empty list like any other change', () => {
    const merged = mergePreferences(current, { immediateFeedback: false, archivedDatasets: [] });

    expect(merged.immediateFeedback).toBe(false);
    expect(merged.archivedDatasets).toEqual([]);
  });

  it('keeps the current value of a field set to undefined', () => {
    expect(mergePreferences(current, { selectedAIModels: undefined }).selectedAIModels).toEqual(
      current.selectedAIModels,
    );
  });
});

describe('fetchUserPreferences', () => {
  it("reads the user's row", async () => {
    queueResponse('user_preferences', { data: storedRow });

    expect(await fetchUserPreferences('user-1')).toEqual(toUserPreferences(storedRow));
    expect(queriesFor('user_preferences')[0].ops).toContainEqual({
      method: 'eq',
      args: ['user_id', 'user-1'],
    });
  });

  it('returns null for a user who has no row yet', async () => {
    queueResponse('user_preferences', { data: null });

    expect(await fetchUserPreferences('user-1')).toBeNull();
  });

  it('throws on a failed read rather than passing off defaults as the stored preferences', async () => {
    queueResponse('user_preferences', { error: { message: 'boom' } });

    await expect(fetchUserPreferences('user-1')).rejects.toEqual({ message: 'boom' });
  });
});

describe('createUserPreferences', () => {
  it('stores the defaults for the user and returns them', async () => {
    const created = await createUserPreferences('user-1');

    expect(created).toEqual(defaultUserPreferences());
    expect(payloadOf(queriesFor('user_preferences')[0], 'insert')).toEqual({
      user_id: 'user-1',
      immediate_feedback: false,
      archived_datasets: [],
      selected_university_datasets: [],
      keyboard_bindings: DEFAULT_KEYBOARD_BINDINGS,
      statistics_date_range: { preset: 'all' },
      selected_ai_models: DEFAULT_AI_MODELS,
      enhanced_ai_version: 'none',
    });
  });

  it('throws when the row cannot be stored', async () => {
    queueResponse('user_preferences', { error: { message: 'boom' } });

    await expect(createUserPreferences('user-1')).rejects.toEqual({ message: 'boom' });
  });
});

describe('saveUserPreferences', () => {
  it("writes every preference back to the user's row, as it was read", async () => {
    // A round trip must not lose anything: what was read is what gets written,
    // unknown bindings included.
    const row = {
      ...storedRow,
      keyboard_bindings: { ...storedRow.keyboard_bindings, toggleEnhancedAI: 'e' },
    };

    await saveUserPreferences('user-1', toUserPreferences(row));

    const [update] = queriesFor('user_preferences');
    expect(payloadOf(update, 'update')).toEqual({ ...row, updated_at: expect.any(String) });
    expect(update.ops).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
  });

  it('throws when the row cannot be written', async () => {
    queueResponse('user_preferences', { error: { message: 'boom' } });

    await expect(saveUserPreferences('user-1', defaultUserPreferences())).rejects.toEqual({
      message: 'boom',
    });
  });
});
