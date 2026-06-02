import { passwordComplexityMessage, registerSchema } from './register.dto';

const validPassword = 'TestPass123';

describe('registerSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: validPassword,
      confirmPassword: 'OtherPass123',
    });

    expect(result.success).toBe(false);
  });

  it('normalizes email addresses', () => {
    const result = registerSchema.parse({
      name: 'Ada Lovelace',
      email: 'ADA@EXAMPLE.COM',
      password: validPassword,
      confirmPassword: validPassword,
    });

    expect(result.email).toBe('ada@example.com');
  });

  it('rejects weak passwords without required character classes', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'aaaaaaaa',
      confirmPassword: 'aaaaaaaa',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        passwordComplexityMessage,
      );
    }
  });
});
