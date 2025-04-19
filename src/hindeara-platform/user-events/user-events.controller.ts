import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserEventsService } from './user-events.service';
import { UserEvent } from './entities/user-event.entity';

@Controller('user-events')
export class UserEventsController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Get()
  async findAll(): Promise<UserEvent[]> {
    return this.userEventsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEvent | null> {
    return this.userEventsService.findOne(id);
  }
}
