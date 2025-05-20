import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { UserByIdPipe } from 'src/hindeara-platform/users/pipes/user-by-id.pipe';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('platforms')
@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/users/:userId/processUserInput')
  @ApiResponse({ status: 200, type: ProcessUserInputResponseDto })
  async processUserInput(
    @Param('userId', ParseIntPipe, UserByIdPipe) user: User,
    @Body() dto: ProcessUserInputDto,
  ): Promise<ProcessUserInputResponseDto> {
    return ProcessUserInputResponseDto.fromAppEvent(
      await this.platformService.processUserInput(user, dto.recording),
    );
  }
}
