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
      "Returns entire user score history for all phonemes (null if missing).",
  })
  @LogMethod()
  async findAllUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<
    Array<{ phonemeId: number; letter: string; value: string | null; createdAt: Date }>
  > {
    return this.scoreService.findAllUser(userId);
  }

  @Get('/:userId/latest')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns all phonemes with the user's latest score (null if missing).",
  })
  @LogMethod()
  async findLatestForUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<
    Array<{ phonemeId: number; letter: string; value: string | null }>
  > {
    return this.scoreService.findLatestForUser(userId);
  }
}
