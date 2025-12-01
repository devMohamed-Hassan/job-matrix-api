import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface UnifiedSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, UnifiedSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<UnifiedSuccessResponse<T>> {
    return next.handle().pipe(
      map((response: any) => {
        if (
          response &&
          typeof response === "object" &&
          "success" in response
        ) {
          return response;
        }

        const hasDataProp =
          response &&
          typeof response === "object" &&
          Object.prototype.hasOwnProperty.call(response, "data");
        const hasMessageProp =
          response &&
          typeof response === "object" &&
          Object.prototype.hasOwnProperty.call(response, "message");

        if (hasDataProp || hasMessageProp) {
          const { data, message, ...rest } = response || {};

          return {
            success: true as const,
            message,
            data: data !== undefined ? data : (rest as T),
          };
        }

        return {
          success: true as const,
          data: response as T,
        };
      })
    );
  }
}


