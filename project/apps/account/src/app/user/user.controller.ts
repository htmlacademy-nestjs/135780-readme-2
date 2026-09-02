import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserDetailRdo } from './rdo/user-detail.rdo';
import { UserService } from './user.service';

@ApiTags('users')
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user credentials' })
  @ApiOkResponse({ type: UserDetailRdo })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  public login(@Body() dto: LoginUserDto): Promise<UserDetailRdo> {
    return this.service.login(dto);
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
