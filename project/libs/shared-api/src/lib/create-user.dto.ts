import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { USER_LIMITS } from './user.constants.js';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  public email!: string;

  @ApiProperty({
    minLength: USER_LIMITS.name.minimum,
    maxLength: USER_LIMITS.name.maximum,
    example: 'Иван Иванов',
  })
  @IsString()
  @Length(USER_LIMITS.name.minimum, USER_LIMITS.name.maximum)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public name!: string;

  @ApiProperty({
    minLength: USER_LIMITS.password.minimum,
    maxLength: USER_LIMITS.password.maximum,
    example: 'secret12',
  })
  @IsString()
  @Length(USER_LIMITS.password.minimum, USER_LIMITS.password.maximum)
  public password!: string;

  @ApiPropertyOptional({
    description: 'Идентификатор ранее загруженного аватара',
  })
  @IsOptional()
  @IsUUID()
  public avatarId?: string;
}
