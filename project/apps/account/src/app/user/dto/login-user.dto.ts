import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  public email!: string;

  @ApiProperty({ minLength: 6, maxLength: 12, example: 'secret12' })
  @IsString()
  @Length(6, 12)
  public password!: string;
}
