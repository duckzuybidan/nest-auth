import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse } from '@nestjs/swagger';
import { ErrorResponseType } from 'src/common/types';

export function BadRequestResponse(params: {
  example?: ErrorResponseType;
}): MethodDecorator {
  const { example } = params;
  const schema: Record<string, any> = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: example?.message || 'Bad Request',
      },
      errorDetail: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: { type: 'string' },
        },
        example: example?.errorDetail,
      },
    },
    required: ['message'],
  };

  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request',
      schema,
    }),
  );
}
