import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '../enum/user.enum';
import { access_roles_key } from '../decorator/auth.decorator';
import { Request } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const requiredRoles = this.reflector.get<RoleEnum[]>(
        access_roles_key,
        context.getHandler(),
      );

      if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No specific roles required, access granted
      }

      const contextType = context.getType<'http' | 'ws' | 'graphql'>();
      let user: any;

      // Resolve the user object dynamically based on context type
      if (contextType === 'http') {
        const request = context.switchToHttp().getRequest<Request>();
        user = (request as any).user;
      } else if (contextType === 'ws') {
        const client = context.switchToWs().getClient<Socket>();
        user = client.data?.user;
      } else if (contextType === 'graphql') {
        const gqlContext = context.getArgByIndex(2);
        user = gqlContext.req?.user;
      } else {
        throw new UnauthorizedException('Invalid request context type');
      }

      if (!user || !user.role) {
        throw new UnauthorizedException('Not authenticated or role not found');
      }

      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new UnauthorizedException('Unauthorized: Insufficient permissions');
      }

      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Authorization failed');
    }
  }
}
