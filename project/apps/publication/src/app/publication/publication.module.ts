import { Module } from '@nestjs/common';
import { PublicationController } from './publication.controller';
import { PublicationMemoryRepository } from './publication-memory.repository';
import { PUBLICATION_REPOSITORY } from './publication.repository';
import { PublicationService } from './publication.service';

@Module({
  controllers: [PublicationController],
  providers: [
    PublicationService,
    PublicationMemoryRepository,
    {
      provide: PUBLICATION_REPOSITORY,
      useExisting: PublicationMemoryRepository,
    },
  ],
})
export class PublicationModule {}
