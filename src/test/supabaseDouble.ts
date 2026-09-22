/**
 * A stand-in for the Supabase query builder, for specs that cover a service.
 *
 * The real builder is thenable: awaiting it runs the query. This double keeps
 * the chain, records every call so a spec can assert on the payload that would
 * have been sent, and hands out queued responses per table.
 *
 * State is module-level on purpose. `vi.mock` factories cannot close over a
 * spec's own variables, so both the factory and the spec reach the same double
 * by importing this module:
 *
 * ```ts
 * vi.mock('@/integrations/supabase/client', async () => ({
 *   supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
 * }));
 * ```
 */

export interface SupabaseResult {
  data?: unknown;
  error?: unknown;
}

export interface RecordedQuery {
  table: string;
  ops: Array<{ method: string; args: unknown[] }>;
}

const responses = new Map<string, SupabaseResult[]>();

/** Every query built since the last reset, in the order they were started. */
export const recordedQueries: RecordedQuery[] = [];

/** Queues one response for the next query against `table`. */
export const queueResponse = (table: string, result: SupabaseResult) => {
  const queued = responses.get(table) ?? [];
  queued.push(result);
  responses.set(table, queued);
};

/** Clears queued responses and recorded queries. Call it in `beforeEach`. */
export const resetSupabaseDouble = () => {
  responses.clear();
  recordedQueries.length = 0;
};

/** The queries recorded against one table, oldest first. */
export const queriesFor = (table: string): RecordedQuery[] =>
  recordedQueries.filter((query) => query.table === table);

/** The payload a recorded insert, update or upsert would have sent. */
export const payloadOf = (
  query: RecordedQuery,
  method: 'insert' | 'update' | 'upsert',
): Record<string, unknown> => {
  const op = query.ops.find((candidate) => candidate.method === method);
  if (!op) throw new Error(`no ${method} recorded for ${query.table}`);
  return op.args[0] as Record<string, unknown>;
};

const nextResponse = (table: string): SupabaseResult =>
  responses.get(table)?.shift() ?? { data: [], error: null };

const CHAIN_METHODS = [
  'select',
  'eq',
  'neq',
  'in',
  'or',
  'gte',
  'lte',
  'lt',
  'not',
  'order',
  'limit',
  'update',
  'insert',
  'upsert',
  'delete',
] as const;

/** Terminal methods that resolve instead of continuing the chain. */
const SETTLING_METHODS = ['maybeSingle', 'single'] as const;

const createBuilder = (table: string) => {
  const recorded: RecordedQuery = { table, ops: [] };
  recordedQueries.push(recorded);

  const settle = () => {
    const { data = null, error = null } = nextResponse(table);
    return Promise.resolve({ data, error });
  };

  const builder: Record<string, unknown> = {
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      settle().then(onFulfilled, onRejected),
  };

  CHAIN_METHODS.forEach((method) => {
    builder[method] = (...args: unknown[]) => {
      recorded.ops.push({ method, args });
      return builder;
    };
  });

  SETTLING_METHODS.forEach((method) => {
    builder[method] = (...args: unknown[]) => {
      recorded.ops.push({ method, args });
      return settle();
    };
  });

  return builder;
};

/** Drop-in for the `supabase` client, covering the query builder only. */
export const supabaseDouble = {
  from: (table: string) => createBuilder(table),
};
