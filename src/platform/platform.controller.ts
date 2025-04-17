import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';

@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/users/:userId/processUserInput')
  async processUserInput(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ProcessUserInputDto,
  ): Promise<ProcessUserInputResponseDto> {
    return await this.platformService.processUserInput(userId, dto.recording);
  }
}
