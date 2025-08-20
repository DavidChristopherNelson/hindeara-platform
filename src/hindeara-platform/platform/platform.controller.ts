// src/hindeara-platform/platform/platform.controller.ts
import { Body, Controller, Post, Headers } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

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
    return ProcessUserInputResponseDto.fromAppEvent(
      await this.platformService.processUserInput(
        dto.phoneNumber,
        dto.recording,
        locale,
        dto.textInput,
      ),
    );
  }
}
