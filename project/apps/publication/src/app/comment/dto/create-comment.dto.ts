import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ minLength: 10, maxLength: 300 })
  @IsString()
  @Length(10, 300)
  public text!: string;
}
