export type SuccessResponseType<T1 = any, T2 = any> = {
  message: string;
  data: T1;
  meta?: T2;
};

export type ErrorResponseType = {
  message: string;
  errorDetail?: Record<string, string[]>;
};
