export const APPLICATION_PORTS = {
  account: 3000,
  publication: 3001,
  file: 3002,
  notification: 3003,
  gateway: 3004,
} as const;

export const HTTP_SETTINGS = {
  timeout: 10000,
  globalPrefix: 'api',
  swaggerPath: 'swagger',
  apiVersion: '1.0',
} as const;

export const CONNECTION_LIMITS = { passwordMinimumLength: 8 } as const;

export const AUTH_SETTINGS = {
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
  algorithm: 'HS256',
} as const;
