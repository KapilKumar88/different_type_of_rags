import { z } from 'zod';

export const askQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Question is required'),
});

export type AskQuestionDto = z.infer<typeof askQuestionSchema>;
