import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { AppEvent } from './entities/app-event.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppEventsService {
  constructor(
    @InjectRepository(AppEvent)
    private appEventRepository: Repository<AppEvent>,
    private readonly usersService: UsersService,
  ) {}

  async create(createAppEventDto: CreateAppEventDto): Promise<AppEvent> {
    const user = await this.usersService.findOne(createAppEventDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const appEvent = this.appEventRepository.create({
      ...createAppEventDto,
      user,
    });
    return this.appEventRepository.save(appEvent);
  }

  async findAll(): Promise<AppEvent[]> {
    return this.appEventRepository.find();
  }

  async findOne(id: number): Promise<AppEvent | null> {
    return this.appEventRepository.findOne({ where: { id } });
  }
}
