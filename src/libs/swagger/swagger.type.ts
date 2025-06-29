import { HttpStatus, Type } from '@nestjs/common';
import { ErrorResponseType, SuccessResponseType } from 'src/common/types';

export type SwaggerType = {
  response?: Type<any> | Type<any>[];
  metaResponse?: Type<any>;
  summary?: string;
  description?: string;
  withAuth?: boolean;
  successCode?: HttpStatus;
  successExample?: SuccessResponseType<any>;
  errorCodes?: HttpStatus[];
  badRequestExample?: ErrorResponseType;
};
