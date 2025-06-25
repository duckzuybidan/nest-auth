import { HttpStatus, Type } from '@nestjs/common';
import { ErrorResponseType, SuccessResponseType } from 'src/common/types';

export type SwaggerOptionsType<T = unknown> = {
  response?: Type<T>;
  operation?: string;
  description?: string;
  withAuth?: boolean;
  successCode?: HttpStatus;
  successExample?: SuccessResponseType<T>;
  errorCodes?: HttpStatus[];
  badRequestExample?: ErrorResponseType;
};
