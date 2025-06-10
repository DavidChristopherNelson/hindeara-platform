import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { MiniLessonsService } from './mini-lessons.service';
import { MiniLesson } from './entities/mini-lesson.entity';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@ApiTags('mini-lessons')
@Controller('mini-lessons')
export class MiniLessonsController {
  constructor(private readonly miniLessonsService: MiniLessonsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all miniLessons.',
    type: [MiniLesson],
  })
  @LogMethod()
  findAll(): Promise<MiniLesson[]> {
    return this.miniLessonsService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'MiniLesson ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a miniLesson by id.',
  })
  @ApiResponse({ status: 404, description: 'MiniLesson not found.' })
  @LogMethod()
  findOne(@Param('id') id: string): Promise<MiniLesson | null> {
    return this.miniLessonsService.findOne(+id);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'MiniLesson ID',
  })
  @ApiResponse({ status: 204, description: 'Mini lesson deleted.' })
  @ApiResponse({ status: 404, description: 'Mini lesson not found.' })
  @LogMethod()
  remove(@Param('id') id: string) {
    return this.miniLessonsService.remove(+id);
  }

  @Get('by-user/:userId')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiQuery({
    name: 'locale',
    type: String,
    required: true,
    description: 'Locale code (e.g., "en" or "hi")',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of words that a user has covered.',
    type: [String],
  })
  @LogMethod()
  findAllWordsByUserIdAndLocale(
    @Param('userId') userId: string,
    @Query('locale') locale: string,
  ): Promise<string[]> {
    return this.miniLessonsService.findAllWordsByUserIdAndLocale(
      +userId,
      locale,
    );
  }

  @Get('by-user/:userId')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiQuery({
    name: 'locale',
    type: String,
    required: true,
    description: 'Locale code (e.g., "en" or "hi")',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of letters that a user has covered.',
    type: [String],
  })
  @LogMethod()
  findAllLettersByUserIdAndLocale(
    @Param('userId') userId: string,
    @Query('locale') locale: string,
  ): Promise<string[]> {
    return this.miniLessonsService.findAllLettersByUserIdAndLocale(
      +userId,
      locale,
    );
  }
}
