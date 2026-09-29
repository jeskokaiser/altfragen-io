import { describe, expect, it } from 'vitest';
import { fetchAllRows } from './fetchAllRows';

const rowsOf = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({ id: offset + i }));

/** A table of `total` rows behind an API that returns at most `cap` per response. */
const cappedTable = (total: number, cap: number) => {
  const ranges: Array<[number, number]> = [];
  const page = async (from: number, to: number) => {
    ranges.push([from, to]);
    const end = Math.min(to + 1, total, from + cap);
    return { data: rowsOf(Math.max(0, end - from), from), error: null, count: total };
  };
  return { page, ranges };
};

describe('fetchAllRows', () => {
  it('costs one request when everything fits in one response', async () => {
    const table = cappedTable(3, 20_000);

    expect(await fetchAllRows(table.page)).toHaveLength(3);
    expect(table.ranges).toHaveLength(1);
  });

  it('reads the rest in pages of the size the server capped the first response to', async () => {
    const table = cappedTable(23_600, 20_000);

    const rows = await fetchAllRows(table.page);

    expect(rows.map((row) => row.id)).toEqual(rowsOf(23_600).map((row) => row.id));
    expect(table.ranges.slice(1)).toEqual([[20_000, 39_999]]);
  });

  it('adapts to a lower cap without being told', async () => {
    const table = cappedTable(2_500, 1_000);

    const rows = await fetchAllRows(table.page);

    expect(rows).toHaveLength(2_500);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2_500);
    expect(table.ranges.slice(1)).toEqual([
      [1_000, 1_999],
      [2_000, 2_999],
    ]);
  });

  it('stops at an exactly full response', async () => {
    const table = cappedTable(1_000, 1_000);

    expect(await fetchAllRows(table.page)).toHaveLength(1_000);
    expect(table.ranges).toHaveLength(1);
  });

  it('returns nothing for an empty read', async () => {
    expect(await fetchAllRows(async () => ({ data: null, error: null, count: 0 }))).toEqual([]);
  });

  it('refuses a read without a total, which would hide a capped response', async () => {
    await expect(
      fetchAllRows(async () => ({ data: rowsOf(3), error: null, count: null })),
    ).rejects.toThrow("count: 'exact'");
  });

  it('throws when any page fails instead of returning part of the rows', async () => {
    await expect(
      fetchAllRows(async (from) =>
        from === 0
          ? { data: rowsOf(1_000), error: null, count: 1_500 }
          : { data: null, error: { message: 'boom' }, count: null },
      ),
    ).rejects.toEqual({ message: 'boom' });

    await expect(
      fetchAllRows(async () => ({ data: null, error: { message: 'first' }, count: null })),
    ).rejects.toEqual({ message: 'first' });
  });
});
