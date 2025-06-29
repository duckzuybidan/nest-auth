import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { SuccessResponseType } from 'src/common/types';

export function SuccessResponse<T1 = any, T2 = any>(params: {
  status?: HttpStatus;
  dataDto?: Type<T1> | Type<T1>[];
  metaDto?: Type<T2>;
  example?: SuccessResponseType<T1, T2>;
}): MethodDecorator {
  const { status = HttpStatus.OK, dataDto, metaDto, example } = params;

  const isArray = Array.isArray(dataDto);
  const targetDataDto = isArray
    ? (dataDto as Type<T1>[])[0]
    : (dataDto as Type<T1> | undefined);

  const properties: Record<string, any> = {
    message: {
      type: 'string',
      example: example?.message || 'Success',
    },
    data: targetDataDto
      ? isArray
        ? {
            type: 'array',
            items: { $ref: getSchemaPath(targetDataDto) },
            example: example?.data,
          }
        : {
            $ref: getSchemaPath(targetDataDto),
            example: example?.data,
          }
      : {
          type: 'object',
          example: example?.data || {},
        },
  };
  if (metaDto) {
    properties.meta = {
      $ref: getSchemaPath(metaDto),
      example: example?.meta,
    };
  }

  const schema = {
    type: 'object',
    properties,
    required: ['message', 'data'],
  };

  const responseDecorator =
    status === HttpStatus.CREATED
      ? ApiCreatedResponse({ description: 'Created', schema })
      : ApiOkResponse({ description: 'Success', schema });

  const decorators: MethodDecorator[] = [responseDecorator];

  if (targetDataDto) {
    decorators.push(ApiExtraModels(targetDataDto));
  }
  if (metaDto) {
    decorators.push(ApiExtraModels(metaDto));
  }

  return applyDecorators(...decorators);
}
