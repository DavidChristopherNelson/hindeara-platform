import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { UserEventsService, UserEventWithIds } from './user-events.service';
import { UserEvent } from './entities/user-event.entity';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { findAllFilter } from '../app-events/dto/find-all-filter.dto';

@ApiTags('user-events')
@Controller('user-events')
export class UserEventsController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Get()
  @ApiResponse({ status: 200, type: [UserEvent] })
  @LogMethod()
  async findAll(@Query() filter: findAllFilter): Promise<UserEventWithIds[]> {
    return this.userEventsService.findAll(filter ?? {});
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number, required: true, description: 'ID' })
  @ApiResponse({ status: 200, type: UserEvent })
  @LogMethod()
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEvent | null> {
    return this.userEventsService.findOne(id);
  }
}
