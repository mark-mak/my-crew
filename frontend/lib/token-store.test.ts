import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStore } from '../lib/token-store';

describe('tokenStore', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('returns null when no token has been set', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('returns the token after set()', () => {
    tokenStore.set('my-access-token');
    expect(tokenStore.get()).toBe('my-access-token');
  });

  it('overwrites an existing token on set()', () => {
    tokenStore.set('first');
    tokenStore.set('second');
    expect(tokenStore.get()).toBe('second');
  });

  it('returns null after clear()', () => {
    tokenStore.set('some-token');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});
