import { describe, expect, it } from 'vitest';
import {
  requestResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schemas';

describe('signInSchema', () => {
  it('accepts a valid email and any non-empty password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(
      true,
    );
  });

  it('trims the email and rejects an invalid one', () => {
    const ok = signInSchema.safeParse({ email: '  a@b.com  ', password: 'x' });
    expect(ok.success && ok.data.email).toBe('a@b.com');
    expect(signInSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(
      false,
    );
  });
});

describe('signUpSchema', () => {
  it('requires a password of at least 8 characters', () => {
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(
      false,
    );
    expect(
      signUpSchema.safeParse({ email: 'a@b.com', password: 'longenough' }).success,
    ).toBe(true);
  });

  it('rejects a password longer than 72 characters (bcrypt limit)', () => {
    expect(
      signUpSchema.safeParse({ email: 'a@b.com', password: 'a'.repeat(73) }).success,
    ).toBe(false);
  });
});

describe('requestResetSchema', () => {
  it('validates the email', () => {
    expect(requestResetSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
    expect(requestResetSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('updatePasswordSchema', () => {
  it('requires the two passwords to match', () => {
    expect(
      updatePasswordSchema.safeParse({
        password: 'longenough',
        confirmPassword: 'different1',
      }).success,
    ).toBe(false);
  });

  it('accepts matching valid passwords', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'longenough',
      confirmPassword: 'longenough',
    });
    expect(result.success).toBe(true);
  });

  it('reports the mismatch on the confirmPassword field', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'longenough',
      confirmPassword: 'mismatch12',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        'Passwords do not match',
      );
    }
  });
});
