import { env } from './env';

export const clipConfig = {
  model: env.CLIP_MODEL,
} as const;
