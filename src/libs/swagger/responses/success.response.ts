import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { SuccessResponseType } from 'src/common/types';

export function SuccessResponse<T = any>(params: {
  status?: HttpStatus;
  dto?: Type<T> | Type<T>[]; // now allows array
  example?: SuccessResponseType<T>;
}): MethodDecorator {
  const { status = HttpStatus.OK, dto, example } = params;

  const isArray = Array.isArray(dto);
  const targetDto = isArray
    ? (dto as Type<T>[])[0]
    : (dto as Type<T> | undefined);

  const schema = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: example?.message || 'Success',
      },
      data: targetDto
        ? isArray
          ? {
              type: 'array',
              items: { $ref: getSchemaPath(targetDto) },
              example: example?.data,
            }
          : {
              $ref: getSchemaPath(targetDto),
              example: example?.data,
            }
        : {
            type: 'object',
            example: example?.data || {},
          },
    },
    required: ['message', 'data'],
  };

  const responseDecorator =
    status === HttpStatus.CREATED
      ? ApiCreatedResponse({ description: 'Created', schema })
      : ApiOkResponse({ description: 'Success', schema });

  const decorators: MethodDecorator[] = [responseDecorator];

  if (targetDto) {
    decorators.push(ApiExtraModels(targetDto));
  }

  return applyDecorators(...decorators);
}
