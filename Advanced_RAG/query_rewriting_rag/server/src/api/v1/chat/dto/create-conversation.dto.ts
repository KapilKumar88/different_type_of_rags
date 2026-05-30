import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  documentIds: z
    .array(z.uuid('Document id must be a valid UUID'))
    .min(1, 'Select at least one document'),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
