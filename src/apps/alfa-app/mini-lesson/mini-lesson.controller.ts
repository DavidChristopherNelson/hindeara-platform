import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MiniLessonService } from './mini-lesson.service';
import { CreateMiniLessonDto } from './dto/create-mini-lesson.dto';
import { UpdateMiniLessonDto } from './dto/update-mini-lesson.dto';

@Controller('mini-lesson')
export class MiniLessonController {
  constructor(private readonly miniLessonService: MiniLessonService) {}

  @Post()
  create(@Body() createMiniLessonDto: CreateMiniLessonDto) {
    return this.miniLessonService.create(createMiniLessonDto);
  }

  @Get()
  findAll() {
    return this.miniLessonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.miniLessonService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMiniLessonDto: UpdateMiniLessonDto) {
    return this.miniLessonService.update(+id, updateMiniLessonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.miniLessonService.remove(+id);
  }
}
