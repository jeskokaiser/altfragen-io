import { AnswerDistribution, Question } from '@/types/Question';

/**
 * A `questions` row as it comes back from Supabase.
 *
 * Every field is optional because callers select different column sets: the
 * listing queries deliberately leave out the answer options and load them on
 * demand. Anything not selected simply arrives as `undefined` and the mapper
 * substitutes the same defaults the hand-written mappings used to.
 */
export interface QuestionRow {
  id: string;
  question: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  subject?: string | null;
  correct_answer?: string | null;
  comment?: string | null;
  filename?: string | null;
  created_at?: string | null;
  difficulty?: number | null;
  is_unclear?: boolean | null;
  marked_unclear_at?: string | null;
  university_id?: string | null;
  visibility?: string | null;
  user_id?: string | null;
  exam_semester?: string | null;
  exam_year?: string | null;
  image_key?: string | null;
  show_image_after_answer?: boolean | null;
  exam_name?: string | null;
  question_case?: number | null;
  case_text?: string | null;
  // jsonb, so the generated type is Json and the shape is not guaranteed.
  first_answer_stats?: unknown;
  first_answer_stats_updated_at?: string | null;
  first_answer_sample_size?: number | null;
}

/**
 * Narrows the `first_answer_stats` jsonb to the domain type.
 *
 * Every row that has the column populated carries exactly a, b, c, d, e and
 * total, so in practice this passes the value straight through. It exists so
 * a malformed row yields null -- which the UI already handles -- instead of an
 * object whose fields are silently undefined.
 */
const toAnswerDistribution = (value: unknown): AnswerDistribution | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const stats = value as Record<string, unknown>;
  const asNumber = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
  return {
    a: asNumber(stats.a),
    b: asNumber(stats.b),
    c: asNumber(stats.c),
    d: asNumber(stats.d),
    e: asNumber(stats.e),
    total: asNumber(stats.total),
  };
};

/**
 * Maps a `questions` row to the camelCase domain type.
 *
 * The database and the domain disagree on more than case: `exam_semester` and
 * `exam_year` become `semester` and `year`. Keeping that translation in one
 * place is the point -- it used to be copied out by hand at ten call sites,
 * each with its own subset of fields and its own defaults.
 */
export const mapQuestionRow = (row: QuestionRow): Question => ({
  id: row.id,
  question: row.question,
  optionA: row.option_a ?? '',
  optionB: row.option_b ?? '',
  optionC: row.option_c ?? '',
  optionD: row.option_d ?? '',
  optionE: row.option_e ?? '',
  subject: row.subject ?? '',
  correctAnswer: row.correct_answer ?? '',
  comment: row.comment ?? '',
  filename: row.filename ?? '',
  created_at: row.created_at ?? undefined,
  difficulty: row.difficulty ?? 3,
  is_unclear: row.is_unclear ?? undefined,
  marked_unclear_at: row.marked_unclear_at ?? undefined,
  university_id: row.university_id ?? null,
  visibility: (row.visibility as Question['visibility']) || 'private',
  user_id: row.user_id ?? null,
  semester: row.exam_semester ?? null,
  year: row.exam_year ?? null,
  image_key: row.image_key ?? null,
  show_image_after_answer: row.show_image_after_answer ?? false,
  exam_name: row.exam_name ?? null,
  question_case: row.question_case ?? null,
  case_text: row.case_text ?? null,
});

/**
 * As `mapQuestionRow`, plus the answer-distribution columns. Only the queries
 * that select those columns need this; the rest would carry three always-null
 * fields for nothing.
 */
export const mapQuestionRowWithStats = (row: QuestionRow): Question => ({
  ...mapQuestionRow(row),
  first_answer_stats: toAnswerDistribution(row.first_answer_stats),
  first_answer_stats_updated_at: row.first_answer_stats_updated_at ?? null,
  first_answer_sample_size: row.first_answer_sample_size ?? 0,
});
