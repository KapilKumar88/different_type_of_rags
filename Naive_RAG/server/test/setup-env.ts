process.env.DATABASE_URL ??=
  'postgresql://test_user:test_password@localhost:5432/rag_naive_rag_test';
process.env.JWT_SECRET ??= 'test-only-auth-secret-with-32-characters';
