import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { UserPhonemeScoreService } from './score.service';

@ApiTags('scores')
@Controller('scores')
export class UserPhonemeScoreController {
  constructor(private readonly scoreService: UserPhonemeScoreService) {}

  @Get('/:userId')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns all phonemes with the user's score (null if missing).",
  })
  @LogMethod()
  async findAllForUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<
    Array<{ phonemeId: number; letter: string; value: string | null }>
  > {
    return this.scoreService.findAllForUser(userId);
  }

  @Post('reset/:userId')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiResponse({ status: 204, description: 'All phoneme scores reset to 0.' })
  @HttpCode(204)
  @LogMethod()
  async resetScoresForUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    await this.scoreService.resetAllForUser(userId);
  }
}
