import { ApiProperty } from '@nestjs/swagger';
import type { StoredFile } from '@project/shared-types';
import { IMAGE_LIMITS } from './image.constants.js';

export class StoredFileRdo implements StoredFile {
  @ApiProperty({ type: String, format: 'uuid' }) public id!: string;
  @ApiProperty({ type: String }) public originalName!: string;
  @ApiProperty({ enum: ['image/jpeg', 'image/png'] }) public mimeType!: string;
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    maximum: IMAGE_LIMITS.publication,
  })
  public size!: number;
  @ApiProperty({
    type: String,
    description: 'Image URL relative to the API origin',
  })
  public path!: string;
  @ApiProperty({ type: String, format: 'date-time' }) public createdAt!: Date;
}
