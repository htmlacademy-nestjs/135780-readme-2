import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDetail } from '@project/shared-types';

export class UserDetailRdo implements UserDetail {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public email!: string;

  @ApiProperty()
  public name!: string;

  @ApiPropertyOptional()
  public avatarId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  public createdAt!: Date;

  @ApiProperty()
  public publicationCount!: number;

  @ApiProperty()
  public subscriberCount!: number;
}
