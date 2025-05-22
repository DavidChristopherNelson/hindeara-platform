import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserEventsService } from './user-events.service';
import { UserEvent } from './entities/user-event.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@ApiTags('user-events')
@Controller('user-events')
export class UserEventsController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Get()
  @ApiResponse({ status: 200, type: [UserEvent] })
  @LogMethod()
  async findAll(): Promise<UserEvent[]> {
    return this.userEventsService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: UserEvent })
  @LogMethod()
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEvent | null> {
    return this.userEventsService.findOne(id);
  }
}
