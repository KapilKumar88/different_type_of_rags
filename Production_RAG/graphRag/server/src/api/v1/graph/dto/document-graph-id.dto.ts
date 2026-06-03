import { z } from 'zod';

export const documentGraphIdSchema = z.object({
  documentId: z.string().uuid(),
});

export type DocumentGraphIdDto = z.infer<typeof documentGraphIdSchema>;
