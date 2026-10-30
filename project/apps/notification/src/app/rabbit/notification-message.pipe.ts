import { ValidationPipe, type PipeTransform, type Type } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class NotificationMessagePipe implements PipeTransform {
  private readonly pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: () => new RpcException('Invalid notification event'),
  });
  public constructor(private readonly schema: Type<object>) {}
  public async transform(payload: unknown): Promise<object> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new RpcException('Invalid notification event');
    }
    return this.pipe.transform(payload, {
      type: 'body',
      metatype: this.schema,
    });
  }
}
