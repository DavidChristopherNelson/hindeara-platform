import { Injectable } from '@nestjs/common';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { UpdateAppEventDto } from './dto/update-app-event.dto';

@Injectable()
export class AppEventsService {
  create(createAppEventDto: CreateAppEventDto) {
    return 'This action adds a new appEvent';
  }

  findAll() {
    return `This action returns all appEvents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} appEvent`;
  }

  update(id: number, updateAppEventDto: UpdateAppEventDto) {
    return `This action updates a #${id} appEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} appEvent`;
  }
}
