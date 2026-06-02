import { z } from 'zod';

export const conversationIdSchema = z.object({
  conversationId: z.uuid('Conversation id must be a valid UUID'),
});

export type ConversationIdDto = z.infer<typeof conversationIdSchema>;
