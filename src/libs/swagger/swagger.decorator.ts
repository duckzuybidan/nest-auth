import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation } from '@nestjs/swagger';

import {
  BadRequestResponse,
  ForbiddenResponse,
  SuccessResponse,
  UnauthorizedResponse,
  InternalServerErrorResponse,
} from './responses';
import { SwaggerOptionsType } from './swagger.type';
import { ACCESS_TOKEN } from 'src/common/constants';

export function Swagger(options: SwaggerOptionsType): MethodDecorator {
  const {
    response,
    operation,
    description,
    withAuth,
    successCode,
    successExample,
    errorCodes = [],
    badRequestExample,
  } = options;

  const decorators: MethodDecorator[] = [];

  if (operation) {
    decorators.push(ApiOperation({ summary: operation }));
  }

  if (description) {
    decorators.push(ApiOperation({ description }));
  }
  if (withAuth) {
    decorators.push(ApiCookieAuth(ACCESS_TOKEN));
  }
  if (response || successCode) {
    decorators.push(
      SuccessResponse({
        dto: response,
        status: successCode,
        example: successExample,
      }),
    );
  }
  if (errorCodes.includes(HttpStatus.BAD_REQUEST)) {
    decorators.push(
      BadRequestResponse({
        example: badRequestExample,
      }),
    );
  }

  if (errorCodes.includes(HttpStatus.FORBIDDEN)) {
    decorators.push(ForbiddenResponse());
  }

  if (errorCodes.includes(HttpStatus.UNAUTHORIZED)) {
    decorators.push(UnauthorizedResponse());
  }
  decorators.push(InternalServerErrorResponse());
  return applyDecorators(...decorators);
}
