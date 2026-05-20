import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvFile, mergeEnvironment, parseEnvironment } from './env';

describe('server environment config', () => {
  const validEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/rag_naive_rag',
  };

  it('requires DATABASE_URL instead of applying a source-code default', () => {
    expect(() => parseEnvironment({ NODE_ENV: 'development' })).toThrow();
  });

  it('parses a valid explicit DATABASE_URL', () => {
    const parsedEnvironment = parseEnvironment(validEnvironment);

    expect(parsedEnvironment.DATABASE_URL).toBe(validEnvironment.DATABASE_URL);
  });

  it('loads values from a dotenv-style file', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'rag-env-'));
    const envFilePath = join(tempDirectory, '.env');

    try {
      writeFileSync(
        envFilePath,
        [
          '# local development config',
          'DATABASE_URL=postgresql://file:secret@localhost:5432/rag_file',
          'JWT_SECRET="file-secret-that-is-long-enough"',
          '',
        ].join('\n'),
      );

      expect(loadEnvFile(envFilePath)).toEqual({
        DATABASE_URL: 'postgresql://file:secret@localhost:5432/rag_file',
        JWT_SECRET: 'file-secret-that-is-long-enough',
      });
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('keeps explicit environment values ahead of dotenv file values', () => {
    const mergedEnvironment = mergeEnvironment(
      {
        DATABASE_URL: 'postgresql://file:secret@localhost:5432/rag_file',
      },
      {
        DATABASE_URL: 'postgresql://shell:secret@localhost:5432/rag_shell',
      },
    );

    expect(mergedEnvironment.DATABASE_URL).toBe(
      'postgresql://shell:secret@localhost:5432/rag_shell',
    );
  });

  it('rejects the default CSRF secret in production', () => {
    expect(() =>
      parseEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
        JWT_SECRET: 'production-auth-secret-with-32-characters',
      }),
    ).toThrow();
  });
});
