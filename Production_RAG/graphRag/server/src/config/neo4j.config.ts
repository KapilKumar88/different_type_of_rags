import { env } from './env';

export const neo4jConfig = {
  uri: env.NEO4J_URI,
  username: env.NEO4J_USERNAME,
  password: env.NEO4J_PASSWORD,
  database: env.NEO4J_DATABASE,
} as const;
