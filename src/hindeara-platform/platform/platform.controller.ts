import {
  Body,
  Controller,
  Post,
  Headers,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlatformService } from './platform.service';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyzeDataResponseDto } from './dto/analyze-data-response.dto';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { AnalyzeDataQueryDto } from './dto/analyze-data-query.dto';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { memoryStorage } from 'multer';

@ApiTags('platforms')
@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/processUserInput')
  @UseInterceptors(
    FileInterceptor('recording', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recording', 'phoneNumber'],
      properties: {
        recording: { type: 'string', format: 'binary' },
        phoneNumber: { type: 'string' },
        textInput: { type: 'string', nullable: true },
        previousRequestReceivedAt: { type: 'string', format: 'date-time', nullable: true },
        requestSentAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Processes user input and returns structured response.',
    type: ProcessUserInputResponseDto,
  })
  @LogMethod()
  async processUserInput(
    @Headers('accept-language') locale: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ProcessUserInputDto,
  ): Promise<ProcessUserInputResponseDto> {
    const requestReceivedByBackendAt = new Date();
    if (!file?.buffer?.length) {
      throw new BadRequestException('No recording uploaded or file is empty.');
    }
    // Fast-fail on unexpected MIME types
    const allowedPrefixes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
    if (file.mimetype && !allowedPrefixes.some(p => file.mimetype.startsWith(p))) {
      throw new BadRequestException(`Unsupported content type: ${file.mimetype}`);
    }
    const recordingBase64 = file?.buffer?.toString('base64') ?? '';

    return ProcessUserInputResponseDto.fromAppEvent(
      await this.platformService.processUserInput(
        dto.phoneNumber,
        recordingBase64,
        locale,
        dto.textInput,
        dto.previousRequestReceivedAt ? new Date(dto.previousRequestReceivedAt) : undefined,
        dto.requestSentAt ? new Date(dto.requestSentAt) : undefined,
        requestReceivedByBackendAt,
      ),
    );
  }

  @Get('/analyzeData')
  @ApiResponse({
    status: 200,
    description: 'Analyzes data and returns analysis.',
    type: AnalyzeDataResponseDto,
  })
  async analyzeData(
    @Query() query: AnalyzeDataQueryDto,
  ): Promise<AnalyzeDataResponseDto> {
    const { phoneNumber, timeWindow } = query;
    return this.platformService.analyzeData(phoneNumber, timeWindow);
  }
}

