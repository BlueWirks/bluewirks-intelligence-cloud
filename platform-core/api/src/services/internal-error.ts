import { ZodError } from "zod";
import * as contracts from "@bluewirks/contracts";

const ErrorEnvelopeSchema = contracts.ErrorEnvelopeSchema;
const ErrorCodeSchema = contracts.ErrorCodeSchema;
type ErrorCode = contracts.ErrorCode;

export class InternalApiError extends Error {
  status: number;
  code: ErrorCode;
  traceId?: string;
  details?: Array<{ path: string; message: string }>;

  constructor(input: {
    status: number;
    code: ErrorCode;
    message: string;
    traceId?: string;
    details?: Array<{ path: string; message: string }>;
  }) {
    super(input.message);
    this.status = input.status;
    this.code = input.code;
    this.traceId = input.traceId;
    this.details = input.details;
  }
}

export function toValidationDetails(error: unknown): Array<{ path: string; message: string }> | undefined {
  if (!(error instanceof ZodError)) {
    return undefined;
  }

  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

export function buildInternalErrorEnvelope(input: {
  code: ErrorCode;
  message: string;
  requestId?: string;
  traceId?: string;
  details?: Array<{ path: string; message: string }>;
}) {
  const code = ErrorCodeSchema.parse(input.code);

  return ErrorEnvelopeSchema.parse({
    error: {
      code,
      message: input.message,
    },
    details: input.details,
    requestId: input.requestId,
    traceId: input.traceId,
    timestamp: new Date().toISOString(),
  });
}
