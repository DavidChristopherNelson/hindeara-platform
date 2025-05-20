import { Controller, Get, Param, Delete } from '@nestjs/common';
import { MiniLessonsService } from './mini-lessons.service';
import { MiniLesson } from './entities/mini-lesson.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

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
  findAll(): Promise<MiniLesson[]> {
    return this.miniLessonsService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Returns a miniLesson by id.',
  })
  @ApiResponse({ status: 404, description: 'MiniLesson not found.' })
  findOne(@Param('id') id: string): Promise<MiniLesson | null> {
    return this.miniLessonsService.findOne(+id);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Mini lesson deleted.' })
  @ApiResponse({ status: 404, description: 'Mini lesson not found.' })
  remove(@Param('id') id: string) {
    return this.miniLessonsService.remove(+id);
  }
}
