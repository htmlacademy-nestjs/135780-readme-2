import { ApiProperty } from '@nestjs/swagger';

export class NotificationResultRdo {
  @ApiProperty({ type: 'integer', minimum: 0 }) public recipientCount!: number;
  @ApiProperty({ type: 'integer', minimum: 0 })
  public publicationCount!: number;
}
