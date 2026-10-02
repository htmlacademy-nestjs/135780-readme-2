import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationPublicationModel } from '../notification-publication/notification-publication.model';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly transporter: nodemailer.Transporter;
  private readonly sender: string;

  public constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    const password = config.get<string>('SMTP_PASSWORD');
    this.sender = config.getOrThrow<string>('SMTP_FROM');
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.getOrThrow<number>('SMTP_PORT'),
      secure: config.getOrThrow<boolean>('SMTP_SECURE'),
      ...(user && password ? { auth: { user, pass: password } } : {}),
    });
  }

  public async sendDigest(
    email: string,
    publications: NotificationPublicationModel[],
  ): Promise<void> {
    const entries = publications.map((item) =>
      `• ${item.title ?? `Публикация (${item.type})`} [${item.publicationId}] — ${item.publishedAt.toISOString()}`,
    );
    await this.transporter.sendMail({
      from: this.sender,
      to: email,
      subject: 'Новые публикации Readme',
      text: `Новые публикации:\n\n${entries.join('\n')}`,
    });
  }

  public onModuleDestroy(): void {
    this.transporter.close();
  }
}
