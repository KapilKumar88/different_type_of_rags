import { z } from 'zod';

export const updateConversationDocumentsSchema = z.object({
  documentIds: z
    .array(z.uuid('Document id must be a valid UUID'))
    .min(1, 'Select at least one document'),
});

export type UpdateConversationDocumentsDto = z.infer<
  typeof updateConversationDocumentsSchema
>;
