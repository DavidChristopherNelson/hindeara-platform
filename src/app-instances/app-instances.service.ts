import { Injectable } from '@nestjs/common';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';
import { UpdateAppInstanceDto } from './dto/update-app-instance.dto';

@Injectable()
export class AppInstancesService {
  create(createAppInstanceDto: CreateAppInstanceDto) {
    return 'This action adds a new appInstance';
  }

  findAll() {
    return `This action returns all appInstances`;
  }

  findOne(id: number) {
    return `This action returns a #${id} appInstance`;
  }

  update(id: number, updateAppInstanceDto: UpdateAppInstanceDto) {
    return `This action updates a #${id} appInstance`;
  }

  remove(id: number) {
    return `This action removes a #${id} appInstance`;
  }
}
