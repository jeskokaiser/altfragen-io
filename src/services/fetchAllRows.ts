/**
 * The API answers a request with at most a fixed number of rows (20,000 on
 * this project, a dashboard setting) and cuts the rest off without an error.
 * A read that can exceed that has to be paged.
 */

/** More than any response is allowed to hold, so the first page is capped by the server. */
const FIRST_PAGE = 1_000_000;

interface PageResult<T> {
  data: T[] | null;
  error: unknown;
  count: number | null;
}

/**
 * Every row of a read, however many the API returns per response.
 *
 * `page` builds the query for the rows `from`..`to` (inclusive, as `.range`
 * takes them). It must select with `{ count: 'exact' }`, and order by a unique
 * column, or rows can repeat or go missing between pages.
 *
 * The first request asks for everything. When the total says rows are
 * missing, the server capped the response, and its length is the cap: the
 * rest is fetched in pages of that size, in parallel. So a read under the cap
 * costs one request, as before, whatever the cap is set to.
 */
export const fetchAllRows = async <T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> => {
  const first = await page(0, FIRST_PAGE - 1);
  if (first.error) throw first.error;
  if (first.count === null) {
    // Without a total, a capped response looks complete -- the bug this avoids.
    throw new Error("fetchAllRows: select with { count: 'exact' }");
  }

  const rows = first.data ?? [];
  const pageSize = rows.length;
  if (pageSize === 0 || pageSize >= first.count) return rows;

  const starts: number[] = [];
  for (let from = pageSize; from < first.count; from += pageSize) starts.push(from);

  const rest = await Promise.all(starts.map((from) => page(from, from + pageSize - 1)));
  rest.forEach(({ error }) => {
    if (error) throw error;
  });

  return rows.concat(...rest.map(({ data }) => data ?? []));
};
