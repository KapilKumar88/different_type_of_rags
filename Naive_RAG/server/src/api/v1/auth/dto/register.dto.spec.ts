import { registerSchema } from './register.dto';

describe('registerSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
      confirmPassword: 'password456',
    });

    expect(result.success).toBe(false);
  });

  it('normalizes email addresses', () => {
    const result = registerSchema.parse({
      name: 'Ada Lovelace',
      email: 'ADA@EXAMPLE.COM',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.email).toBe('ada@example.com');
  });
});
