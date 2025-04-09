import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { HindearaEventsService } from './hindeara-events.service';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';
import { HindearaEvent } from './entities/hindeara-event.entity';

@Controller('hindeara-events')
export class HindearaEventsController {
  constructor(private readonly hindearaEventsService: HindearaEventsService) {}

  @Post()
  async create(
    @Body() createHindearaEventDto: CreateHindearaEventDto,
  ): Promise<HindearaEvent> {
    return this.hindearaEventsService.create(createHindearaEventDto);
  }

  @Get()
  async findAll(): Promise<HindearaEvent[]> {
    return this.hindearaEventsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HindearaEvent | null> {
    return this.hindearaEventsService.findOne(id);
  }
}
