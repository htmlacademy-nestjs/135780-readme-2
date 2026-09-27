import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { QUERY_LIMITS } from '../../common/query.constants';

export class CommentQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: QUERY_LIMITS.defaultPage })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number;
}
