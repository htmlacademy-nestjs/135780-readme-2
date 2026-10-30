import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthStatus } from './health.service';
import { Access, RouteAccess } from '../auth/route-access.decorator';

@ApiTags('health')
@Controller('health')
@Access(RouteAccess.Public)
export class HealthController {
  public constructor(private readonly service: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API Gateway availability' })
  @ApiOkResponse({
    description: 'API Gateway is available',
    schema: {
      type: 'object',
      required: ['status', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  public check(): HealthStatus {
    return this.service.check();
  }
}
