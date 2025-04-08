import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HindearaEventsService } from './hindeara-events.service';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';
import { UpdateHindearaEventDto } from './dto/update-hindeara-event.dto';

@Controller('hindeara-events')
export class HindearaEventsController {
  constructor(private readonly hindearaEventsService: HindearaEventsService) {}

  @Post()
  create(@Body() createHindearaEventDto: CreateHindearaEventDto) {
    return this.hindearaEventsService.create(createHindearaEventDto);
  }

  @Get()
  findAll() {
    return this.hindearaEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hindearaEventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHindearaEventDto: UpdateHindearaEventDto) {
    return this.hindearaEventsService.update(+id, updateHindearaEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hindearaEventsService.remove(+id);
  }
}
