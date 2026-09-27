import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { JWT_CONFIGURATION } from '../config/environment.validation';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { UserService } from '../user/user.service';
import { TokenType } from './auth.constants';
import { AuthTokensRdo } from './rdo/auth-tokens.rdo';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async login(dto: LoginUserDto): Promise<AuthTokensRdo> {
    const user = await this.userService.verifyCredentials(dto);
    const basePayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, tokenType: TokenType.Access },
        this.getSignOptions(
          JWT_CONFIGURATION.accessSecret,
          JWT_CONFIGURATION.accessExpiresIn,
        ),
      ),
      this.jwtService.signAsync(
        { ...basePayload, tokenType: TokenType.Refresh },
        this.getSignOptions(
          JWT_CONFIGURATION.refreshSecret,
          JWT_CONFIGURATION.refreshExpiresIn,
        ),
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private getSignOptions(
    secretKey: string,
    expiresInKey: string,
  ): JwtSignOptions {
    return {
      secret: this.configService.getOrThrow<string>(secretKey),
      expiresIn: this.configService.getOrThrow<string>(
        expiresInKey,
      ) as JwtSignOptions['expiresIn'],
    };
  }
}
