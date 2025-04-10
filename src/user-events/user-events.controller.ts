import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UserEventsService } from './user-events.service';
import { CreateUserEventDto } from './dto/create-user-event.dto';
import { UserEvent } from './entities/user-event.entity';

@Controller('user-events')
export class UserEventsController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Post()
  async create(
    @Body() createUserEventDto: CreateUserEventDto,
  ): Promise<UserEvent> {
    return this.userEventsService.create(createUserEventDto);
  }

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
