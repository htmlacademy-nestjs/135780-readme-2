import { Module } from '@nestjs/common';
import { PublicationNotificationModule } from '../notification/notification.module';
import { PublicationController } from './publication.controller';
import { PublicationPrismaRepository } from './publication-prisma.repository';
import { PUBLICATION_REPOSITORY } from './publication.repository';
import { PublicationService } from './publication.service';

@Module({
  imports: [PublicationNotificationModule],
  controllers: [PublicationController],
  providers: [
    PublicationService,
    PublicationPrismaRepository,
    {
      provide: PUBLICATION_REPOSITORY,
      useExisting: PublicationPrismaRepository,
    },
  ],
  exports: [PublicationService],
})
export class PublicationModule {}
