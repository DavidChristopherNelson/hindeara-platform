import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { AppEvent } from './entities/app-event.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

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
  async findAll(): Promise<AppEvent[]> {
    return this.appEventsService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Returns the appEvent that matches the id.',
    type: AppEvent,
  })
  @ApiResponse({
    status: 404,
    description: 'AppEvent not found.',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppEvent | null> {
    return this.appEventsService.findOne(id);
  }
}
