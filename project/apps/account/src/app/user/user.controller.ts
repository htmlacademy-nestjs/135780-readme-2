import { HttpErrorRdo } from '@project/shared-api';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserId } from '../common/user-id.decorator';
import { UserDetailRdo } from './rdo/user-detail.rdo';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBadRequestResponse({
  type: HttpErrorRdo,
  description: 'Request validation failed',
})
@Controller('users')
export class UserController {
  public constructor(private readonly service: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ type: UserDetailRdo })
  @ApiConflictResponse({
    type: HttpErrorRdo,
    description: 'Email is already registered',
  })
  public register(@Body() dto: CreateUserDto): Promise<UserDetailRdo> {
    return this.service.register(dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({
    name: 'x-user-id',
    description: 'Authenticated user forwarded by API Gateway',
  })
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiNoContentResponse({ description: 'Password changed' })
  @ApiUnauthorizedResponse({
    type: HttpErrorRdo,
    description: 'Current password is incorrect',
  })
  @ApiNotFoundResponse({ type: HttpErrorRdo, description: 'User not found' })
  public changePassword(
    @UserId(ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.service.changePassword(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed user information' })
  @ApiOkResponse({ type: UserDetailRdo })
  @ApiNotFoundResponse({ type: HttpErrorRdo, description: 'User not found' })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailRdo> {
    return this.service.getById(id);
  }
}
