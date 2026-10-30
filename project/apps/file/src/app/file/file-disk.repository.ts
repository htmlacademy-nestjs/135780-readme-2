import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { StoredFile } from '@project/shared-types';
import { FileEntity } from './file.entity';
import type { FileRepository } from './file.repository';

@Injectable()
export class FileDiskRepository implements FileRepository {
  private readonly directory: string;

  public constructor(config: ConfigService) {
    this.directory = resolve(config.getOrThrow<string>('UPLOAD_DIRECTORY'));
  }

  public async save(entity: FileEntity, content: Buffer): Promise<FileEntity> {
    await mkdir(this.directory, { recursive: true });
    const contentPath = this.getPath(entity.id, 'bin');
    await writeFile(contentPath, content, { flag: 'wx' });
    try {
      await writeFile(this.getPath(entity.id, 'json'), JSON.stringify(entity), {
        flag: 'wx',
      });
    } catch (error) {
      await unlink(contentPath);
      throw error;
    }
    return entity;
  }

  public async findById(id: string): Promise<FileEntity | null> {
    const data = await this.read(id, 'json');
    return data
      ? FileEntity.restore(JSON.parse(data.toString('utf8')) as StoredFile)
      : null;
  }

  public readContent(id: string): Promise<Buffer | null> {
    return this.read(id, 'bin');
  }

  private getPath(id: string, extension: string): string {
    if (!isUUID(id)) {
      throw new Error('Invalid stored file identifier');
    }
    return join(this.directory, `${id}.${extension}`);
  }

  private async read(id: string, extension: string): Promise<Buffer | null> {
    try {
      return await readFile(this.getPath(id, extension));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}
