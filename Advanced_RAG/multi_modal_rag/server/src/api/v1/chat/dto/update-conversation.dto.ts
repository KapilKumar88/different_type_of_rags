import { z } from 'zod';

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1, 'Conversation title is required').max(180),
});

export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;
