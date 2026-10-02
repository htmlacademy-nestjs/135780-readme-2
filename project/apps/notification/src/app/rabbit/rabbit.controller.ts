import { BadRequestException, Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  NotificationRabbitRouting,
  PublicationType,
  type PublicationPublishedEvent,
  type UserRegisteredEvent,
} from '@project/shared-types';
import { plainToInstance } from 'class-transformer';
import { IsEmail, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, validate } from 'class-validator';
import { NotificationPublicationRepository } from '../notification-publication/notification-publication.repository';
import { SubscriberRepository } from '../subscriber/subscriber.repository';

class UserRegisteredMessage implements UserRegisteredEvent {
  @IsUUID()
  public userId!: string;

  @IsEmail()
  public email!: string;

  @IsString()
  public name!: string;
}

class PublicationPublishedMessage implements PublicationPublishedEvent {
  @IsUUID()
  public publicationId!: string;

  @IsUUID()
  public authorId!: string;

  @IsEnum(PublicationType)
  public type!: PublicationType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  public title?: string;

  @IsISO8601()
  public publishedAt!: string;
}

@Controller()
export class RabbitController {
  private readonly logger = new Logger(RabbitController.name);

  public constructor(
    private readonly subscribers: SubscriberRepository,
    private readonly publications: NotificationPublicationRepository,
  ) {}

  @EventPattern(NotificationRabbitRouting.UserRegistered)
  public async onUserRegistered(
    @Payload() payload: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(context, async () => {
      const event = await this.parse(UserRegisteredMessage, payload);
      await this.subscribers.save(event);
    });
  }

  @EventPattern(NotificationRabbitRouting.PublicationPublished)
  public async onPublicationPublished(
    @Payload() payload: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(context, async () => {
      const event = await this.parse(PublicationPublishedMessage, payload);
      await this.publications.save(event);
    });
  }

  private async parse<T extends object>(
    type: new () => T,
    payload: unknown,
  ): Promise<T> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Invalid notification event');
    }
    const event = plainToInstance(type, payload);
    const errors = await validate(event, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      throw new BadRequestException('Invalid notification event');
    }
    return event;
  }

  private async process(context: RmqContext, action: () => Promise<void>): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await action();
      channel.ack(message);
    } catch (error) {
      const invalid = error instanceof BadRequestException;
      channel.nack(message, false, !invalid);
      this.logger.error(invalid ? 'Invalid notification event rejected' : 'Notification event processing failed', error);
    }
  }
}
