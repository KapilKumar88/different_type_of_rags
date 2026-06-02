import { PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe<TInput, TOutput> implements PipeTransform<
  TInput,
  TOutput
> {
  constructor(private readonly schema: ZodType<TOutput, TInput>) {}

  transform(value: TInput): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'Validation failed',
        data: result.error.flatten(),
      });
    }

    return result.data;
  }
}
