import { Injectable } from '@nestjs/common';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';

@Injectable()
export class InterfaceService {
  async run(user: User): Promise<CreateAppEventDto> {
    return 'This action adds a new interface';
  }
}
