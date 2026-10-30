import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDetail } from '@project/shared-types';
import { USER_LIMITS } from './user.constants.js';

export class UserDetailRdo implements UserDetail {
  @ApiProperty({ type: String, format: 'uuid' })
  public id!: string;

  @ApiProperty({ type: String, format: 'email' })
  public email!: string;

  @ApiProperty({
    type: String,
    minLength: USER_LIMITS.name.minimum,
    maxLength: USER_LIMITS.name.maximum,
  })
  public name!: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  public avatarId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  public createdAt!: Date;

  @ApiProperty({ type: 'integer', minimum: 0 })
  public publicationCount!: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  public subscriberCount!: number;
}
