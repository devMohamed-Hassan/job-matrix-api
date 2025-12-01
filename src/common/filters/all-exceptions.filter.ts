import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Error as MongooseError } from "mongoose";

export interface UnifiedErrorResponse {
  success: false;
  message: string;
  errorCode?: string | number;
  stack?: string;
  details?: any;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isDev = process.env.NODE_ENV === "development";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errorCode: string | number | undefined;
    let details: any = undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === "object"
      ) {
        const res: any = exceptionResponse;

        if (Array.isArray(res.message)) {
          message = res.message[0] ?? "Validation failed";
          details = {
            messages: res.message,
            error: res.error,
          };
        } else {
          message = res.message || res.error || message;
          details = {
            error: res.error,
          };
        }

        errorCode = res.statusCode ?? status;
      } else {
        message = exception.message;
      }

      stack = exception instanceof Error ? exception.stack : undefined;
    }

    else if (
      exception instanceof MongooseError.ValidationError ||
      exception instanceof MongooseError.CastError
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message || "Database validation error";
      errorCode =
        exception.name === "CastError" ? "MONGOOSE_CAST_ERROR" : "MONGOOSE_VALIDATION_ERROR";

      if (exception instanceof MongooseError.ValidationError) {
        details = {
          errors: Object.keys(exception.errors).map((key) => ({
            path: key,
            message: exception.errors[key]?.message,
          })),
        };
      } else if (exception instanceof MongooseError.CastError) {
        details = {
          path: (exception as any).path,
          value: (exception as any).value,
          kind: (exception as any).kind,
        };
      }

      stack = exception.stack;
    }

    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || message;
      errorCode = "INTERNAL_SERVER_ERROR";
      stack = exception.stack;
    }

    const body: UnifiedErrorResponse = {
      success: false,
      message,
      errorCode,
      ...(isDev && stack ? { stack } : {}),
      ...(details !== undefined ? { details } : {}),
    };

    response.status(status).json(body);
  }
}


