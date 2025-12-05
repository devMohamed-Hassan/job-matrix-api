import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '../../modules/user/entities/user.entity';

@Injectable()
export class GraphQLAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext()?.req;
    
    if (!request) {
      return true;
    }

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    return true;
  }
}
