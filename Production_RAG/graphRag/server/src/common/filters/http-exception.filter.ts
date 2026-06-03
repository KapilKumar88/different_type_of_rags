import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

type ErrorResponseBody = {
  success?: boolean;
  message?: string | string[];
  data?: unknown;
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (this.isErrorResponseBody(exceptionResponse)) {
      response.status(status).json({
        success: false,
        message: this.resolveMessage(exceptionResponse.message),
        data: exceptionResponse.data ?? null,
      });
      return;
    }

    response.status(status).json({
      success: false,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (HttpStatus[status] ?? 'Request failed'),
      data: null,
    });
  }

  private isErrorResponseBody(value: unknown): value is ErrorResponseBody {
    return typeof value === 'object' && value !== null;
  }

  private resolveMessage(message: string | string[] | undefined): string {
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message ?? 'Request failed';
  }
}
