import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ProcessUserInputDto } from './dto/process-user-input.dto';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { User } from 'src/users/entities/user.entity';
import { UserByIdPipe } from 'src/users/pipes/user-by-id.pipe';

@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('/users/:userId/processUserInput')
  async processUserInput(
    @Param('userId', ParseIntPipe, UserByIdPipe) user: User,
    @Body() dto: ProcessUserInputDto,
  ): Promise<ProcessUserInputResponseDto> {
    return await this.platformService.processUserInput(user, dto.recording);
  }
}
