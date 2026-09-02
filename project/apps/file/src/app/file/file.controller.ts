import {
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import type { UploadedFileData } from './uploaded-file.interface';

const MAX_IMAGE_SIZE = 1024 * 1024;
const IMAGE_FILE_TYPE = /(jpeg|png)$/;

@ApiTags('files')
@Controller('files')
export class FileController {
  public constructor(private readonly service: FileService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
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
  @ApiCreatedResponse({ description: 'File metadata created' })
  public upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: IMAGE_FILE_TYPE })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE })
        .build(),
    )
    file: UploadedFileData,
  ): Promise<FileEntity> {
    return this.service.save(file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiOkResponse({ description: 'Stored file metadata' })
  @ApiNotFoundResponse({ description: 'File not found' })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileEntity> {
    return this.service.getById(id);
  }
}
