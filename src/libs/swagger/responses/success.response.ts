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
  dto?: Type<T>;
  example?: SuccessResponseType<T>;
}): MethodDecorator {
  const { status = HttpStatus.OK, dto, example } = params;

  const schema = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: example?.message || 'Success',
      },
      data: dto
        ? { $ref: getSchemaPath(dto) }
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

  if (dto) {
    decorators.push(ApiExtraModels(dto));
  }

  return applyDecorators(...decorators);
}
