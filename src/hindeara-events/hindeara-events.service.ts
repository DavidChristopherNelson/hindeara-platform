import { Injectable } from '@nestjs/common';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';
import { UpdateHindearaEventDto } from './dto/update-hindeara-event.dto';

@Injectable()
export class HindearaEventsService {
  create(createHindearaEventDto: CreateHindearaEventDto) {
    return 'This action adds a new hindearaEvent';
  }

  findAll() {
    return `This action returns all hindearaEvents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} hindearaEvent`;
  }

  update(id: number, updateHindearaEventDto: UpdateHindearaEventDto) {
    return `This action updates a #${id} hindearaEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} hindearaEvent`;
  }
}
