import { Body, Controller, Post, Headers } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

interface extractServiceData {
  service: string;
  serviceAnswer: string;
  responseTime: number;
  correctAnswer: string;
  computerAssessment: boolean;
  appEventId: number;
  state: string;
}

@ApiTags('platforms')
@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/processUserInput')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'User ID',
  })
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
    return ProcessUserInputResponseDto.fromAppEvent(
      await this.platformService.processUserInput(
        dto.phoneNumber,
        dto.recording,
        locale,
      ),
    );
  }

  @Post('/analyzeData')
  @LogMethod()
  analyzeData(): Promise<extractServiceData[]> {
    return this.platformService.analyzeData();
  }
}
