import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { GatewayAuthGuard } from './gateway-auth.guard';
import { ROUTE_ACCESS, RouteAccess } from './route-access.decorator';

const AUTH_FIXTURE = {
  accessSecret: 'test-access-secret-at-least-32-characters',
  userId: '00000000-0000-4000-8000-000000000001',
} as const;

function createContext(
  request: object,
  access: RouteAccess = RouteAccess.Protected,
): ExecutionContext {
  const handler = () => undefined;
  Reflect.defineMetadata(ROUTE_ACCESS, access, handler);
  return {
    getHandler: () => handler,
    getClass: () => Object,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

test('access token identity wins over an untrusted user header', async () => {
  const jwt = new JwtService();
  const guard = new GatewayAuthGuard(
    jwt,
    new ConfigService({ JWT_ACCESS_SECRET: AUTH_FIXTURE.accessSecret }),
    new Reflector(),
  );
  const token = await jwt.signAsync(
    {
      sub: AUTH_FIXTURE.userId,
      email: 'reader@example.com',
      tokenType: 'access',
    },
    { secret: AUTH_FIXTURE.accessSecret, expiresIn: '1m' },
  );
  const request = {
    headers: { authorization: `Bearer ${token}`, 'x-user-id': 'spoofed' },
    user: undefined as unknown,
  };
  assert.equal(await guard.canActivate(createContext(request)), true);
  assert.equal((request.user as { sub: string }).sub, AUTH_FIXTURE.userId);
});

test('missing, expired and refresh tokens cannot access protected endpoints', async () => {
  const jwt = new JwtService();
  const guard = new GatewayAuthGuard(
    jwt,
    new ConfigService({ JWT_ACCESS_SECRET: AUTH_FIXTURE.accessSecret }),
    new Reflector(),
  );
  await assert.rejects(
    guard.canActivate(createContext({ headers: {} })),
    UnauthorizedException,
  );
  for (const options of [
    { tokenType: 'refresh', expiresIn: 60 },
    { tokenType: 'access', expiresIn: -1 },
  ]) {
    const token = await jwt.signAsync(
      { sub: AUTH_FIXTURE.userId, tokenType: options.tokenType },
      { secret: AUTH_FIXTURE.accessSecret, expiresIn: options.expiresIn },
    );
    await assert.rejects(
      guard.canActivate(
        createContext({ headers: { authorization: `Bearer ${token}` } }),
      ),
      UnauthorizedException,
    );
  }
});

test('registration is anonymous only, while public reads permit anonymous users', async () => {
  const jwt = new JwtService();
  const guard = new GatewayAuthGuard(
    jwt,
    new ConfigService({ JWT_ACCESS_SECRET: AUTH_FIXTURE.accessSecret }),
    new Reflector(),
  );
  assert.equal(
    await guard.canActivate(createContext({ headers: {} }, RouteAccess.Public)),
    true,
  );
  const token = await jwt.signAsync(
    { sub: AUTH_FIXTURE.userId, tokenType: 'access' },
    { secret: AUTH_FIXTURE.accessSecret },
  );
  await assert.rejects(
    guard.canActivate(
      createContext(
        { headers: { authorization: `Bearer ${token}` } },
        RouteAccess.Anonymous,
      ),
    ),
    ForbiddenException,
  );
});
