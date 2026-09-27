import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDetailRdo } from './rdo/user-detail.rdo';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBadRequestResponse({ description: 'Request validation failed' })
@Controller('users')
export class UserController {
  public constructor(private readonly service: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ type: UserDetailRdo })
  @ApiConflictResponse({ description: 'Email is already registered' })
  public register(@Body() dto: CreateUserDto): Promise<UserDetailRdo> {
    return this.service.register(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed user information' })
  @ApiOkResponse({ type: UserDetailRdo })
  @ApiNotFoundResponse({ description: 'User not found' })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailRdo> {
    return this.service.getById(id);
  }
}
