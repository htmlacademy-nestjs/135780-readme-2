import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { USER_LIMITS } from './user.constants.js';

export class ChangePasswordDto {
  @ApiProperty({
    minLength: USER_LIMITS.password.minimum,
    maxLength: USER_LIMITS.password.maximum,
  })
  @IsString()
  @Length(USER_LIMITS.password.minimum, USER_LIMITS.password.maximum)
  public currentPassword!: string;

  @ApiProperty({
    minLength: USER_LIMITS.password.minimum,
    maxLength: USER_LIMITS.password.maximum,
  })
  @IsString()
  @Length(USER_LIMITS.password.minimum, USER_LIMITS.password.maximum)
  public newPassword!: string;
}
