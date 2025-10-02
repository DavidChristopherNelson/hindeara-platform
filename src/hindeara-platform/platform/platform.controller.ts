// src/hindeara-platform/platform/platform.controller.ts
import { Body, Controller, Post, Headers, Get, Query } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyzeDataResponseDto } from './dto/analyze-data-response.dto';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { AnalyzeDataQueryDto } from './dto/analyze-data-query.dto';

@ApiTags('platforms')
@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/processUserInput')
  @ApiBody({ type: ProcessUserInputDto })
  @ApiResponse({
    status: 200,
    description: 'Processes user input and returns structured response.',
    type: ProcessUserInputResponseDto,
  })
  @LogMethod()
  async processUserInput(
    @Headers('accept-language') locale: string,
    @Body() dto: ProcessUserInputDto,
  ): Promise<ProcessUserInputResponseDto> {
    const requestReceivedByBackendAt = new Date();
    return ProcessUserInputResponseDto.fromAppEvent(
      await this.platformService.processUserInput(
        dto.phoneNumber,
        dto.recording,
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
