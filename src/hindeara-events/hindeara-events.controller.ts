import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HindearaEventsService } from './hindeara-events.service';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';

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
}
