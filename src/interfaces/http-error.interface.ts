export interface HttpErrorOptions {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}
