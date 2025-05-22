import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { UserByIdPipe } from 'src/hindeara-platform/users/pipes/user-by-id.pipe';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@ApiTags('platforms')
@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/users/:userId/processUserInput')
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
    @Param('userId', ParseIntPipe, UserByIdPipe) user: User,
    @Body() dto: ProcessUserInputDto,
  ): Promise<ProcessUserInputResponseDto> {
    return ProcessUserInputResponseDto.fromAppEvent(
      await this.platformService.processUserInput(user, dto.recording),
    );
  }
}
