import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { generateCsrfToken } from '../../../common/security/csrf-protection';
import { Public } from '../../../guard/decorators/public.decorator';
import { serverErrorResponse, successEnvelope } from '../../../swagger/openapi';

@ApiTags('CSRF')
@Controller('api/v1/csrf-token')
export class CsrfController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Generate a CSRF token for mutating requests' })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated',
    schema: successEnvelope({
      type: 'object',
      required: ['csrfToken'],
      properties: {
        csrfToken: { type: 'string' },
      },
    }),
  })
  @ApiResponse({ status: 500, ...serverErrorResponse })
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
