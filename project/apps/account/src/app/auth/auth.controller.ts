import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { AuthService } from './auth.service';
import { AuthTokensRdo } from './rdo/auth-tokens.rdo';

@ApiTags('authentication')
@ApiBadRequestResponse({ description: 'Request validation failed' })
@Controller('users')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in and issue an access/refresh token pair' })
  @ApiOkResponse({ type: AuthTokensRdo })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  public login(@Body() dto: LoginUserDto): Promise<AuthTokensRdo> {
    return this.authService.login(dto);
  }
}
