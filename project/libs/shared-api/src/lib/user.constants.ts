export const USER_LIMITS = {
  name: { minimum: 3, maximum: 50 },
  password: { minimum: 6, maximum: 12 },
  jwtSecretMinimumLength: 32,
} as const;
