import { applyDecorators } from '@nestjs/common';
import { ApiInternalServerErrorResponse } from '@nestjs/swagger';

export function InternalServerErrorResponse(): MethodDecorator {
  const schema: Record<string, any> = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Internal Server Error',
      },
    },
    required: ['message'],
  };

  return applyDecorators(
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      schema,
    }),
  );
}
