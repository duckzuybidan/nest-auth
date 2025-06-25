export type SuccessResponseType<T = any> = {
  message: string;
  data: T;
};

export type ErrorResponseType = {
  message: string;
  errorDetail?: Record<string, string[]>;
};
