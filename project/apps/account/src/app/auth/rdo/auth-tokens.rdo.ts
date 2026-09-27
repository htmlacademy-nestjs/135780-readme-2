import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensRdo {
  @ApiProperty({ description: 'Short-lived JSON Web Token' })
  public accessToken!: string;

  @ApiProperty({ description: 'Long-lived JSON Web Token' })
  public refreshToken!: string;
}
