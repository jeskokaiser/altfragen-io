import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables, TablesInsert } from '@/integrations/supabase/types';

/**
 * Owns `user_preferences`: one row per user (`user_id` is unique) holding what
 * the app remembers between visits -- keyboard bindings, which AI models to
 * show, the statistics date range.
 *
 * Every function here throws on a database error. The context decides what a
 * failure means for the user and which German message they see.
 */

/**
 * A type rather than an interface, like `StatisticsDateRange` below: an
 * interface has no index signature, so it is not assignable to the `Json` of a
 * jsonb column and could only be saved through a cast.
 */
export type KeyboardBindings = {
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  answerE: string;
  confirmAnswer: string;
  nextQuestion: string;
  showSolution: string;
  toggleChatGPT: string;
  toggleGemini: string;
  difficulty1: string;
  difficulty2: string;
  difficulty3: string;
  difficulty4: string;
  difficulty5: string;
};

const DATE_RANGE_PRESETS = ['all', '7days', '30days', '90days', 'custom'] as const;

export type StatisticsDateRange = {
  preset: (typeof DATE_RANGE_PRESETS)[number];
  start?: string; // ISO date string
  end?: string; // ISO date string
};

export type EnhancedAIVersion = 'none' | 'chatgpt' | 'gemini';

export interface UserPreferences {
  immediateFeedback: boolean;
  selectedUniversityDatasets: string[];
  keyboardBindings: KeyboardBindings;
  statisticsDateRange: StatisticsDateRange;
  selectedAIModels: string[];
  enhancedAIVersion: EnhancedAIVersion;
}

export const DEFAULT_KEYBOARD_BINDINGS: KeyboardBindings = {
  answerA: '1',
  answerB: '2',
  answerC: '3',
  answerD: '4',
  answerE: '5',
  confirmAnswer: ' ', // Space bar
  nextQuestion: ' ', // Space bar, same as confirm
  showSolution: 's',
  toggleChatGPT: 'q',
  toggleGemini: 'w',
  difficulty1: 'Shift+1',
  difficulty2: 'Shift+2',
  difficulty3: 'Shift+3',
  difficulty4: 'Shift+4',
  difficulty5: 'Shift+5',
};

export const DEFAULT_AI_MODELS = ['chatgpt', 'new-gemini', 'mistral', 'perplexity', 'deepseek'];

/** The preferences of a user who has not changed anything, as a fresh copy. */
export const defaultUserPreferences = (): UserPreferences => ({
  immediateFeedback: false,
  selectedUniversityDatasets: [],
  keyboardBindings: { ...DEFAULT_KEYBOARD_BINDINGS },
  statisticsDateRange: { preset: 'all' },
  selectedAIModels: [...DEFAULT_AI_MODELS],
  enhancedAIVersion: 'none',
});

const PREFERENCE_COLUMNS =
  'immediate_feedback, selected_university_datasets, keyboard_bindings, statistics_date_range, selected_ai_models, enhanced_ai_version';

type PreferencesRow = Pick<
  Tables<'user_preferences'>,
  | 'immediate_feedback'
  | 'selected_university_datasets'
  | 'keyboard_bindings'
  | 'statistics_date_range'
  | 'selected_ai_models'
  | 'enhanced_ai_version'
>;

type JsonObject = { [key: string]: Json | undefined };

const isJsonObject = (value: Json | undefined): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: Json | undefined): value is string => typeof value === 'string';

/**
 * Stored bindings over the defaults, so a binding added to the app after a row
 * was saved still gets its default -- many rows predate the difficulty
 * bindings. Stored keys the app no longer knows are kept, and so saved back
 * unchanged.
 */
const toKeyboardBindings = (stored: Json): KeyboardBindings => {
  const bindings = isJsonObject(stored)
    ? Object.fromEntries(
        Object.entries(stored).filter((entry): entry is [string, string] => isString(entry[1])),
      )
    : {};

  return { ...DEFAULT_KEYBOARD_BINDINGS, ...bindings };
};

const isDateRangePreset = (value: Json | undefined): value is StatisticsDateRange['preset'] =>
  DATE_RANGE_PRESETS.some((preset) => preset === value);

const toStatisticsDateRange = (stored: Json): StatisticsDateRange => {
  if (!isJsonObject(stored) || !isDateRangePreset(stored.preset)) return { preset: 'all' };

  const range: StatisticsDateRange = { preset: stored.preset };
  if (isString(stored.start)) range.start = stored.start;
  if (isString(stored.end)) range.end = stored.end;
  return range;
};

/**
 * An empty list is a choice -- the user switched every model off -- and stays
 * empty. Only a missing or malformed value falls back to the defaults.
 */
const toSelectedAIModels = (stored: Json): string[] =>
  Array.isArray(stored) ? stored.filter(isString) : [...DEFAULT_AI_MODELS];

const toEnhancedAIVersion = (stored: string | null): EnhancedAIVersion =>
  stored === 'chatgpt' || stored === 'gemini' ? stored : 'none';

export const toUserPreferences = (row: PreferencesRow): UserPreferences => ({
  immediateFeedback: row.immediate_feedback ?? false,
  selectedUniversityDatasets: row.selected_university_datasets ?? [],
  keyboardBindings: toKeyboardBindings(row.keyboard_bindings),
  statisticsDateRange: toStatisticsDateRange(row.statistics_date_range),
  selectedAIModels: toSelectedAIModels(row.selected_ai_models),
  enhancedAIVersion: toEnhancedAIVersion(row.enhanced_ai_version),
});

const toRow = (preferences: UserPreferences): PreferencesRow => ({
  immediate_feedback: preferences.immediateFeedback,
  selected_university_datasets: preferences.selectedUniversityDatasets,
  keyboard_bindings: preferences.keyboardBindings,
  statistics_date_range: preferences.statisticsDateRange,
  selected_ai_models: preferences.selectedAIModels,
  enhanced_ai_version: preferences.enhancedAIVersion,
});

/**
 * Applies a partial change to the current preferences. A field the change
 * leaves out -- or sets to `undefined` -- keeps its current value; `false` and
 * an empty list are changes like any other.
 */
export const mergePreferences = (
  current: UserPreferences,
  changes: Partial<UserPreferences>,
): UserPreferences => ({
  immediateFeedback: changes.immediateFeedback ?? current.immediateFeedback,
  selectedUniversityDatasets:
    changes.selectedUniversityDatasets ?? current.selectedUniversityDatasets,
  keyboardBindings: changes.keyboardBindings ?? current.keyboardBindings,
  statisticsDateRange: changes.statisticsDateRange ?? current.statisticsDateRange,
  selectedAIModels: changes.selectedAIModels ?? current.selectedAIModels,
  enhancedAIVersion: changes.enhancedAIVersion ?? current.enhancedAIVersion,
});

/** The user's preferences, or null when they have no row yet. */
export const fetchUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(PREFERENCE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data ? toUserPreferences(data) : null;
};

/**
 * Stores the defaults for a user who has no row yet, and returns them.
 *
 * Safe to call twice. The context loads on every change of the auth user, and
 * a page load changes it several times in quick succession, so a new user's
 * first visit starts three or four loads at once; each finds no row and calls
 * this. A plain insert let the first through and failed the rest on the unique
 * `user_id`, and each failure showed "Einstellungen konnten nicht geladen
 * werden". The rest now do nothing -- the row they would have written, the
 * defaults, is the row that is there.
 */
export const createUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const preferences = defaultUserPreferences();
  const row: TablesInsert<'user_preferences'> = { user_id: userId, ...toRow(preferences) };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(row, { onConflict: 'user_id', ignoreDuplicates: true });

  if (error) throw error;

  return preferences;
};

/** Writes every preference, not only the changed ones, and stamps `updated_at`. */
export const saveUserPreferences = async (
  userId: string,
  preferences: UserPreferences,
): Promise<void> => {
  const { error } = await supabase
    .from('user_preferences')
    .update({ ...toRow(preferences), updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
};
