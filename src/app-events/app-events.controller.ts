import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { AppEvent } from './entities/app-event.entity';

@Controller('app-events')
export class AppEventsController {
  constructor(private readonly appEventsService: AppEventsService) {}

  @Post()
  async create(@Body() createAppEventDto: CreateAppEventDto): Promise<AppEvent> {
    return this.appEventsService.create(createAppEventDto);
  }

  @Get()
  async findAll(): Promise<AppEvent> {
    return this.appEventsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AppEvent> {
    return this.appEventsService.findOne(+id);
  }
}
