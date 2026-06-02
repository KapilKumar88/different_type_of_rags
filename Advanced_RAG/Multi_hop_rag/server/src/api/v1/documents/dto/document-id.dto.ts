import { z } from 'zod';

export const documentIdSchema = z.object({
  id: z.uuid(),
});

export type DocumentIdDto = z.infer<typeof documentIdSchema>;
