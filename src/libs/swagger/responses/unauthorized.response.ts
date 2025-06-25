import { applyDecorators } from '@nestjs/common';
import { ApiUnauthorizedResponse } from '@nestjs/swagger';
export function UnauthorizedResponse(): MethodDecorator {
  const schema: Record<string, any> = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Unauthorized',
      },
    },
    required: ['message'],
  };

  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema,
    }),
  );
}
