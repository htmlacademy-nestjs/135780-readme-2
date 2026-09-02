import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthStatus } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  public constructor(private readonly service: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API Gateway availability' })
  @ApiOkResponse({ description: 'API Gateway is available' })
  public check(): HealthStatus {
    return this.service.check();
  }
}
