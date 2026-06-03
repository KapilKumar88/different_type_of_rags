import { z } from 'zod';

export const imageIdSchema = z.object({
  imageId: z.uuid(),
});

export type ImageIdDto = z.infer<typeof imageIdSchema>;
