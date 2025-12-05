import { Injectable, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GraphQLJwtAuthGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext) {
    try {
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext()?.req;
      if (!request) {
        return { headers: {} } as any;
      }
      return request;
    } catch (error) {
      return { headers: {} } as any;
    }
  }

  canActivate(context: ExecutionContext) {
    try {
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext()?.req;
      if (!request) {
        return true;
      }
      return super.canActivate(context);
    } catch (error) {
      return true;
    }
  }
}
