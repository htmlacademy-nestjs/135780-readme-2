import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';
import { USER_LIMITS } from './user.constants.js';

export class LoginUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  public email!: string;

  @ApiProperty({
    minLength: USER_LIMITS.password.minimum,
    maxLength: USER_LIMITS.password.maximum,
    example: 'secret12',
  })
  @IsString()
  @Length(USER_LIMITS.password.minimum, USER_LIMITS.password.maximum)
  public password!: string;
}
