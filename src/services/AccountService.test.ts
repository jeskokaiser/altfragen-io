import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke } },
}));

import { deleteUserAccount } from './AccountService';

beforeEach(() => invoke.mockReset());

describe('deleteUserAccount', () => {
  it('asks the Edge Function to delete the account of the session', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });

    expect(await deleteUserAccount()).toEqual({ success: true });
    expect(invoke).toHaveBeenCalledWith('delete-account', { body: { confirm: 'DELETE' } });
  });

  it('reports a failed deletion instead of throwing', async () => {
    const error = new Error('Edge Function returned a non-2xx status code');
    invoke.mockResolvedValue({ data: null, error });

    expect(await deleteUserAccount()).toEqual({ success: false, error });
  });
});
