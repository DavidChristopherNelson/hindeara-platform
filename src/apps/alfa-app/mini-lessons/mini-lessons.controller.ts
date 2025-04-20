import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MiniLessonsService } from './mini-lessons.service';
import { CreateMiniLessonDto } from './dto/create-mini-lesson.dto';
import { UpdateMiniLessonDto } from './dto/update-mini-lesson.dto';

@Controller('mini-lessons')
export class MiniLessonsController {
  constructor(private readonly miniLessonsService: MiniLessonsService) {}

  @Post()
  create(@Body() createMiniLessonDto: CreateMiniLessonDto) {
    return this.miniLessonsService.create(createMiniLessonDto);
  }

  @Get()
  findAll() {
    return this.miniLessonsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.miniLessonsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMiniLessonDto: UpdateMiniLessonDto) {
    return this.miniLessonsService.update(+id, updateMiniLessonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.miniLessonsService.remove(+id);
  }
}
