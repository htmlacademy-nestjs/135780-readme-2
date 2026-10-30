import { HttpErrorRdo } from '@project/shared-api';
import { FilesGatewayService, type ImageUpload } from './files.service';
import {
  Controller,
  Get,
  Header,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { IMAGE_LIMITS } from '@project/shared-api/images';
import { Access, RouteAccess } from '../auth/route-access.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiBackendResponses } from '../backend/api-backend-responses.decorator';
import { type FileData } from '../presentation/presentation.service';
import { FileResponseDto } from '../presentation/response.dto';

const UPLOAD_SCHEMA = {
  type: 'object' as const,
  required: ['file'],
  properties: { file: { type: 'string' as const, format: 'binary' } },
};

@ApiTags('files')
@ApiBackendResponses()
@ApiPayloadTooLargeResponse({
  type: HttpErrorRdo,
  description: 'Image exceeds the allowed size',
})
@Controller('files')
export class FilesController {
  public constructor(private readonly service: FilesGatewayService) {}

  @Post()
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_LIMITS.publication + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: UPLOAD_SCHEMA })
  @ApiOperation({
    summary: 'Upload a JPEG or PNG publication image up to 1 MB',
  })
  @ApiCreatedResponse({ type: FileResponseDto })
  public upload(
    @UploadedFile(new ParseFilePipe()) file: ImageUpload,
    @CurrentUser() userId: string,
  ): Promise<FileData> {
    return this.service.upload(file, userId);
  }

  @Post('avatar')
  @Access(RouteAccess.Public)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_LIMITS.avatar + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: UPLOAD_SCHEMA })
  @ApiOperation({
    summary: 'Upload a JPEG or PNG avatar up to 500 KB before registration',
  })
  @ApiCreatedResponse({ type: FileResponseDto })
  public avatar(
    @UploadedFile(new ParseFilePipe()) file: ImageUpload,
  ): Promise<FileData> {
    return this.service.uploadAvatar(file);
  }

  @Get(':id/content')
  @Access(RouteAccess.Public)
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Download an image' })
  @ApiProduces('image/jpeg', 'image/png')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  public async download(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    return this.service.download(id);
  }

  @Get(':id')
  @Access(RouteAccess.Public)
  @ApiOperation({ summary: 'Get image metadata and download URL' })
  @ApiOkResponse({ type: FileResponseDto })
  public metadata(@Param('id', ParseUUIDPipe) id: string): Promise<FileData> {
    return this.service.getMetadata(id);
  }
}
