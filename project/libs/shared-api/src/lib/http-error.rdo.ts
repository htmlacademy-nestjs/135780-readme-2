import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HttpErrorRdo {
  @ApiProperty({ type: 'integer' }) public statusCode!: number;
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  public message!: string | string[];
  @ApiPropertyOptional({ type: String }) public error?: string;
}
