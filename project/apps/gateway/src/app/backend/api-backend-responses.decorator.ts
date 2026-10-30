import { HttpErrorRdo } from '@project/shared-api';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiServiceUnavailableResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiGatewayTimeoutResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const ApiBackendResponses = () =>
  applyDecorators(
    ApiServiceUnavailableResponse({
      type: HttpErrorRdo,
      description: 'Email delivery is temporarily unavailable',
    }),
    ApiBadRequestResponse({
      type: HttpErrorRdo,
      description: 'Input validation failed',
    }),
    ApiUnauthorizedResponse({
      type: HttpErrorRdo,
      description: 'Access token or credentials are invalid',
    }),
    ApiForbiddenResponse({
      type: HttpErrorRdo,
      description: 'Operation is not permitted',
    }),
    ApiNotFoundResponse({
      type: HttpErrorRdo,
      description: 'Resource not found',
    }),
    ApiConflictResponse({
      type: HttpErrorRdo,
      description: 'Resource state conflicts with the operation',
    }),
    ApiBadGatewayResponse({
      type: HttpErrorRdo,
      description: 'A backend service is unavailable',
    }),
    ApiGatewayTimeoutResponse({
      type: HttpErrorRdo,
      description: 'A backend service did not respond in time',
    }),
  );
