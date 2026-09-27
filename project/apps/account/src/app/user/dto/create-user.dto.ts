import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  public email!: string;

  @ApiProperty({ minLength: 3, maxLength: 50, example: 'Иван Иванов' })
  @IsString()
  @Length(3, 50)
  public name!: string;

  @ApiProperty({ minLength: 6, maxLength: 12, example: 'secret12' })
  @IsString()
  @Length(6, 12)
  public password!: string;

  @ApiPropertyOptional({ description: 'Идентификатор ранее загруженного аватара' })
  @IsOptional()
  @IsUUID()
  public avatarId?: string;
}
