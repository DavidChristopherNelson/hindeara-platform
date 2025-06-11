//src/hindeara-platform/app-events/app-events.controller.ts
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { AppEvent } from './entities/app-event.entity';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { findAllFilter } from './dto/find-all-filter.dto';
import { AppEventWithIds } from './app-events.service';

@ApiTags('appEvents')
@Controller('app-events')
export class AppEventsController {
  constructor(private readonly appEventsService: AppEventsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all appEvents.',
    type: [AppEvent],
  })
  @LogMethod()
  async findAll(@Query() filter: findAllFilter): Promise<AppEventWithIds[]> {
    return this.appEventsService.findAll(filter ?? {});
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number, required: true, description: 'ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the appEvent that matches the id.',
    type: AppEvent,
  })
  @ApiResponse({
    status: 404,
    description: 'AppEvent not found.',
  })
  @LogMethod()
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppEvent | null> {
    return this.appEventsService.findOne(id);
  }
}
