import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { AppEvent } from './entities/app-event.entity';

@Controller('app-events')
export class AppEventsController {
  constructor(private readonly appEventsService: AppEventsService) {}

  @Get()
  async findAll(): Promise<AppEvent[]> {
    return this.appEventsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppEvent | null> {
    return this.appEventsService.findOne(id);
  }
}
