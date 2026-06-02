import { conversationIdSchema } from './conversation-id.dto';
import { z } from 'zod';

export const conversationMessageIdSchema = conversationIdSchema.extend({
  messageId: z.uuid('Message id must be a valid UUID'),
});

export type ConversationMessageIdDto = z.infer<
  typeof conversationMessageIdSchema
>;
