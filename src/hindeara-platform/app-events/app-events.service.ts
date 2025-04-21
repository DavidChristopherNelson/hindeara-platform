import { Injectable } from '@nestjs/common';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { AppEvent } from './entities/app-event.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/hindeara-platform/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/hindeara-platform/users/entities/user.entity';

@Injectable()
export class AppEventsService {
  constructor(
    @InjectRepository(AppEvent)
    private appEventRepository: Repository<AppEvent>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createAppEventDto: CreateAppEventDto,
    user: User,
  ): Promise<AppEvent> {
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

  async findAllByUser(user: User): Promise<AppEvent[]> {
    return this.appEventRepository.find({ where: { user: { id: user.id } } });
  }

  async findMostRecentNByAppIdAndUserId(
    appId: number,
    userId: number,
    n: number,
  ): Promise<AppEvent[]> {
    return this.appEventRepository.find({
      where: { app: { id: appId }, user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: n,
    });
  }
}
