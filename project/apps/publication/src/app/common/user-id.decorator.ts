import {
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

export const UserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'];
    return Array.isArray(userId) ? userId[0] : userId;
  },
);
