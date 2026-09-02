import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileMemoryRepository } from './file-memory.repository';
import { FILE_REPOSITORY } from './file.repository';
import { FileService } from './file.service';

@Module({
  controllers: [FileController],
  providers: [
    FileService,
    FileMemoryRepository,
    {
      provide: FILE_REPOSITORY,
      useExisting: FileMemoryRepository,
    },
  ],
})
export class FileModule {}
