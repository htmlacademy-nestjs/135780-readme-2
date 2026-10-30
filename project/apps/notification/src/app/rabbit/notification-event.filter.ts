import {
  Catch,
  type ArgumentsHost,
  type RpcExceptionFilter,
} from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { EMPTY, type Observable } from 'rxjs';

@Catch()
export class NotificationEventFilter implements RpcExceptionFilter<unknown> {
  public catch(error: unknown, host: ArgumentsHost): Observable<never> {
    const context = host.switchToRpc().getContext<RmqContext>();
    context
      .getChannelRef()
      .nack(context.getMessage(), false, !(error instanceof RpcException));
    return EMPTY;
  }
}
