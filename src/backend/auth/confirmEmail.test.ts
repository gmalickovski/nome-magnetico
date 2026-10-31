import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  confirmEmailAfterPayment,
  isAccountCreatedViaCheckout,
  syncVerifiedEmailMarker,
} from './confirmEmail';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('syncVerifiedEmailMarker', () => {
  it('retorna 409 e não atualiza auth nem profiles quando email_confirmed_at for nulo', async () => {
    let updateUserCalled = false;
    let profileUpdateCalled = false;

    const fakeClient = {
      auth: {
        admin: {
          getUserById: async (id: string) => {
            assert.equal(id, 'user-123');
            return {
              data: {
                user: {
                  id: 'user-123',
                  email: 'teste@example.com',
                  email_confirmed_at: null,
                  user_metadata: {},
                },
              },
              error: null,
            };
          },
          updateUserById: async () => {
            updateUserCalled = true;
            return { data: {}, error: null };
          },
        },
      },
      from: () => ({
        update: () => {
          profileUpdateCalled = true;
          return {
            eq: () => ({
              is: () => Promise.resolve({ error: null }),
            }),
          };
        },
      }),
    } as unknown as SupabaseClient;

    const res = await syncVerifiedEmailMarker('user-123', fakeClient);
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.status, 409);
      assert.match(res.error, /ainda não confirmado/i);
    }
    assert.equal(updateUserCalled, false, 'Não deve chamar updateUserById');
    assert.equal(profileUpdateCalled, false, 'Não deve chamar profiles.update');
  });

  it('retorna 200 e usa o email_confirmed_at real do Supabase Auth quando confirmado', async () => {
    const confirmedTimestamp = '2026-10-18T12:34:56.789Z';
    let updatedMetadata: Record<string, unknown> | null = null;
    let updatedProfileFields: Record<string, unknown> | null = null;

    const fakeClient = {
      auth: {
        admin: {
          getUserById: async (id: string) => {
            assert.equal(id, 'user-456');
            return {
              data: {
                user: {
                  id: 'user-456',
                  email: 'confirmado@example.com',
                  email_confirmed_at: confirmedTimestamp,
                  user_metadata: { custom_flag: true },
                },
              },
              error: null,
            };
          },
          updateUserById: async (id: string, attributes: any) => {
            assert.equal(id, 'user-456');
            updatedMetadata = attributes.user_metadata;
            return { data: {}, error: null };
          },
        },
      },
      from: (table: string) => {
        assert.equal(table, 'profiles');
        return {
          update: (fields: any) => {
            updatedProfileFields = fields;
            return {
              eq: (field: string, val: string) => {
                assert.equal(field, 'id');
                assert.equal(val, 'user-456');
                return {
                  is: (col: string, isVal: null) => {
                    assert.equal(col, 'email_verified_at');
                    assert.equal(isVal, null);
                    return Promise.resolve({ error: null });
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    const res = await syncVerifiedEmailMarker('user-456', fakeClient);
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.verifiedAt, confirmedTimestamp);
    }
    assert.deepEqual(updatedMetadata, {
      custom_flag: true,
      email_verified_at: confirmedTimestamp,
    });
    assert.deepEqual(updatedProfileFields, {
      email_verified_at: confirmedTimestamp,
    });
  });
});

describe('isAccountCreatedViaCheckout', () => {
  it('detecta flag no user_metadata', () => {
    assert.equal(isAccountCreatedViaCheckout({ user_metadata: { account_created_via_checkout: true } }), true);
    assert.equal(isAccountCreatedViaCheckout({ user_metadata: {} }), false);
  });
});

describe('confirmEmailAfterPayment', () => {
  it('não chama email_confirm quando conta comum ainda não confirmou', async () => {
    let confirmCalled = false;

    const fakeClient = {
      auth: {
        admin: {
          getUserById: async () => ({
            data: {
              user: {
                id: 'u1',
                email_confirmed_at: null,
                user_metadata: {},
              },
            },
            error: null,
          }),
          updateUserById: async (_id: string, attrs: { email_confirm?: boolean }) => {
            if (attrs.email_confirm) confirmCalled = true;
            return { data: {}, error: null };
          },
        },
      },
      from: () => ({
        update: () => ({
          eq: () => ({
            is: () => Promise.resolve({ error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    await confirmEmailAfterPayment('u1', fakeClient);
    assert.equal(confirmCalled, false);
  });

  it('confirma via admin só para conta criada no checkout', async () => {
    let confirmCalled = false;
    let syncCalled = false;

    const fakeClient = {
      auth: {
        admin: {
          getUserById: async () => ({
            data: {
              user: {
                id: 'u2',
                email_confirmed_at: null,
                user_metadata: { account_created_via_checkout: true },
              },
            },
            error: null,
          }),
          updateUserById: async (_id: string, attrs: { email_confirm?: boolean }) => {
            if (attrs.email_confirm) confirmCalled = true;
            return { data: {}, error: null };
          },
        },
      },
      from: () => ({
        update: () => {
          syncCalled = true;
          return {
            eq: () => ({
              is: () => Promise.resolve({ error: null }),
            }),
          };
        },
      }),
    } as unknown as SupabaseClient;

    const originalGetUserById = fakeClient.auth.admin.getUserById;
    fakeClient.auth.admin.getUserById = async (id: string) => {
      const first = await originalGetUserById(id);
      if (!confirmCalled) return first;
      return {
        data: {
          user: {
            id: 'u2',
            email_confirmed_at: '2026-10-31T12:00:00.000Z',
            user_metadata: { account_created_via_checkout: true },
          },
        },
        error: null,
      };
    };

    await confirmEmailAfterPayment('u2', fakeClient);
    assert.equal(confirmCalled, true);
    assert.equal(syncCalled, true);
  });
});
