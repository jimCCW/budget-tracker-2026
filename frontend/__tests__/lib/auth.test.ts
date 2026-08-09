import { describe, it, expect } from 'vitest';
import { authOptions } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwtCallback = authOptions.callbacks!.jwt as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionCallback = authOptions.callbacks!.session as any;

describe('authOptions.callbacks.jwt', () => {
  it('merges user fields into the token on initial sign-in', async () => {
    const token = await jwtCallback({
      token: {},
      user: {
        token: 'jwt-from-backend',
        id: 'user-1',
        name: 'Jane Doe',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    });

    expect(token).toMatchObject({
      accessToken: 'jwt-from-backend',
      id: 'user-1',
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });

  it('leaves the token untouched when neither user nor an update trigger is present', async () => {
    const existingToken = {
      accessToken: 'existing-token',
      id: 'user-1',
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const token = await jwtCallback({ token: existingToken });

    expect(token).toEqual(existingToken);
  });

  it('merges name/firstName/lastName from a session update() call', async () => {
    const existingToken = {
      accessToken: 'existing-token',
      id: 'user-1',
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const token = await jwtCallback({
      token: existingToken,
      trigger: 'update',
      session: { name: 'Jane Q. Doe', firstName: 'Jane', lastName: 'Q. Doe' },
    });

    expect(token).toMatchObject({
      accessToken: 'existing-token',
      name: 'Jane Q. Doe',
      firstName: 'Jane',
      lastName: 'Q. Doe',
    });
  });

  it('keeps existing token fields when the update session omits them', async () => {
    const existingToken = {
      accessToken: 'existing-token',
      id: 'user-1',
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const token = await jwtCallback({
      token: existingToken,
      trigger: 'update',
      session: {},
    });

    expect(token).toMatchObject({
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });

  it('ignores an update trigger with no session payload', async () => {
    const existingToken = {
      accessToken: 'existing-token',
      id: 'user-1',
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const token = await jwtCallback({
      token: existingToken,
      trigger: 'update',
      session: undefined,
    });

    expect(token).toEqual(existingToken);
  });
});

describe('authOptions.callbacks.session', () => {
  it('copies accessToken and user fields from the token onto the session', async () => {
    const session = await sessionCallback({
      session: { user: {} },
      token: {
        accessToken: 'jwt-from-backend',
        id: 'user-1',
        name: 'Jane Doe',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    });

    expect(session).toMatchObject({
      accessToken: 'jwt-from-backend',
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    });
  });
});
