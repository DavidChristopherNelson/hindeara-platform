import { Injectable } from '@nestjs/common';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';

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
}
