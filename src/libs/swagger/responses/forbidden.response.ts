import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';

export function ForbiddenResponse(): MethodDecorator {
  const schema: Record<string, any> = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Forbidden',
      },
    },
    required: ['message'],
  };

  return applyDecorators(
    ApiForbiddenResponse({
      description: 'Forbidden',
      schema,
    }),
  );
}
