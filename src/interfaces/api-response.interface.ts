export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: object;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
}
