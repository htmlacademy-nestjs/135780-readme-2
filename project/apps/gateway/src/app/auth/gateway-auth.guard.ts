import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { TokenType } from '@project/shared-types';
import { AUTH_SETTINGS } from '@project/shared-api';
import { ROUTE_ACCESS, RouteAccess } from './route-access.decorator';

interface AuthRequest {
  headers: { authorization?: string };
  user?: { sub: string; tokenType: string };
}

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  public constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const access =
      this.reflector.getAllAndOverride<RouteAccess>(ROUTE_ACCESS, [
        context.getHandler(),
        context.getClass(),
      ]) ?? RouteAccess.Protected;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      if (access === RouteAccess.Protected) {
        throw new UnauthorizedException('An access token is required');
      }
      return true;
    }
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        tokenType: string;
      }>(match[1], {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        algorithms: [AUTH_SETTINGS.algorithm],
      });
      if (payload.tokenType !== TokenType.Access || !isUUID(payload.sub)) {
        throw new Error('Invalid access token payload');
      }
      request.user = { sub: payload.sub, tokenType: payload.tokenType };
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired');
    }
    if (access === RouteAccess.Anonymous) {
      throw new ForbiddenException(
        'Registration is only available to anonymous users',
      );
    }
    return true;
  }
}
