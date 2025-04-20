import { Controller, Get, Param, Delete } from '@nestjs/common';
import { MiniLessonsService } from './mini-lessons.service';

@Controller('mini-lessons')
export class MiniLessonsController {
  constructor(private readonly miniLessonsService: MiniLessonsService) {}

  @Get()
  findAll() {
    return this.miniLessonsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.miniLessonsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.miniLessonsService.remove(+id);
  }
}
