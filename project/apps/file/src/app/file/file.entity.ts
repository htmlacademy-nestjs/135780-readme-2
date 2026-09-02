import { StoredFile } from '@project/shared-types';
import { randomUUID } from 'node:crypto';
import type { UploadedFileData } from './uploaded-file.interface';

const UPLOAD_PATH = '/uploads';

export class FileEntity implements StoredFile {
  public readonly id: string;
  public readonly originalName: string;
  public readonly mimeType: string;
  public readonly size: number;
  public readonly path: string;
  public readonly createdAt: Date;

  public constructor(file: UploadedFileData) {
    this.id = randomUUID();
    this.originalName = file.originalname;
    this.mimeType = file.mimetype;
    this.size = file.size;
    this.path = `${UPLOAD_PATH}/${this.id}`;
    this.createdAt = new Date();
  }
}
