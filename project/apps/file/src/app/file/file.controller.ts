import { HttpErrorRdo } from '@project/shared-api';
import {
  Controller,
  Get,
  Header,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import type { UploadedFileData } from './uploaded-file.interface';
import { IMAGE_FILE_TYPE, IMAGE_LIMITS } from './file.constants';

@ApiTags('files')
@ApiPayloadTooLargeResponse({
  type: HttpErrorRdo,
  description: 'Image exceeds the allowed size',
})
@ApiBadRequestResponse({
  type: HttpErrorRdo,
  description: 'Request validation failed',
})
@Controller('files')
export class FileController {
  public constructor(private readonly service: FileService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_LIMITS.publication + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: FileEntity })
  public upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: IMAGE_FILE_TYPE,
          overrideMimeType: true,
        })
        .addMaxSizeValidator({ maxSize: IMAGE_LIMITS.publication + 1 })
        .build(),
    )
    file: UploadedFileData,
  ): Promise<FileEntity> {
    return this.service.save(file);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_LIMITS.avatar + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a JPEG or PNG avatar up to 500 KB' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: FileEntity })
  public uploadAvatar(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: IMAGE_FILE_TYPE,
          overrideMimeType: true,
        })
        .addMaxSizeValidator({ maxSize: IMAGE_LIMITS.avatar + 1 })
        .build(),
    )
    file: UploadedFileData,
  ): Promise<FileEntity> {
    return this.service.save(file);
  }

  @Get(':id/content')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Download the stored image' })
  @ApiProduces('image/jpeg', 'image/png')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @ApiNotFoundResponse({ type: HttpErrorRdo, description: 'File not found' })
  public async download(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const { metadata, buffer } = await this.service.getContent(id);
    return new StreamableFile(buffer, {
      type: metadata.mimeType,
      length: buffer.length,
      disposition: 'inline',
    });
  }

  @Get('avatars/:id')
  @ApiOperation({ summary: 'Get an image eligible for use as an avatar' })
  @ApiOkResponse({ type: FileEntity })
  @ApiNotFoundResponse({ type: HttpErrorRdo, description: 'File not found' })
  public getAvatar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileEntity> {
    return this.service.getAvatarById(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiOkResponse({ type: FileEntity })
  @ApiNotFoundResponse({ type: HttpErrorRdo, description: 'File not found' })
  public getById(@Param('id', ParseUUIDPipe) id: string): Promise<FileEntity> {
    return this.service.getById(id);
  }
}
