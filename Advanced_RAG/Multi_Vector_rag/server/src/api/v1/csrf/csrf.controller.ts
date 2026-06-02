import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { generateCsrfToken } from '../../../common/security/csrf-protection';
import { Public } from '../../../guard/decorators/public.decorator';

@Controller('api/v1/csrf-token')
export class CsrfController {
  @Public()
  @Get()
  getToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return {
      success: true,
      message: 'CSRF token generated',
      data: {
        csrfToken: generateCsrfToken(request, response),
      },
    };
  }
}
