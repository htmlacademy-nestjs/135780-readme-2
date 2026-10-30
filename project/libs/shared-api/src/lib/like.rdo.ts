import { ApiProperty } from '@nestjs/swagger';
import type { Like } from '@project/shared-types';

export class LikeRdo implements Like {
  @ApiProperty({ type: String, format: 'uuid' }) public id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) public publicationId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) public userId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) public createdAt!: Date;
}
