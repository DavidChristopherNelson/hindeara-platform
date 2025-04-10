import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { UpdateAppEventDto } from './dto/update-app-event.dto';

@Controller('app-events')
export class AppEventsController {
  constructor(private readonly appEventsService: AppEventsService) {}

  @Post()
  create(@Body() createAppEventDto: CreateAppEventDto) {
    return this.appEventsService.create(createAppEventDto);
  }

  @Get()
  findAll() {
    return this.appEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appEventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppEventDto: UpdateAppEventDto) {
    return this.appEventsService.update(+id, updateAppEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appEventsService.remove(+id);
  }
}
