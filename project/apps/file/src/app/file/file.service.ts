import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FileEntity } from './file.entity';
import { FILE_REPOSITORY, type FileRepository } from './file.repository';
import type { UploadedFileData } from './uploaded-file.interface';

@Injectable()
export class FileService {
  public constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repository: FileRepository,
  ) {}

  public async save(file: UploadedFileData): Promise<FileEntity> {
    return this.repository.save(new FileEntity(file));
  }

  public async getById(id: string): Promise<FileEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('File not found');
    }

    return entity;
  }
}
