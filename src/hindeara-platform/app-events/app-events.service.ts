// src/hindeara-platform/app-events/app-events.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { AppEvent } from './entities/app-event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { App } from '../apps/entities/app.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Injectable()
export class AppEventsService {
  constructor(
    @InjectRepository(AppEvent)
    private appEventRepository: Repository<AppEvent>,
  ) {}

  @LogMethod()
  async create(
    createAppEventDto: CreateAppEventDto,
    user: User,
    app: App,
  ): Promise<AppEvent> {
    const createdAppEvent = this.appEventRepository.create({
      ...createAppEventDto,
      user,
      app,
    });
    await this.appEventRepository.save(createdAppEvent);

    // Explicitly update AppEvent's app relations.
    const appEvent = await this.findOne(createdAppEvent.id);
    if (!appEvent) {
      throw new InternalServerErrorException(
        'AppEvent not found after creation, this should not happen.',
      );
    }

    return appEvent;
  }

  @LogMethod()
  async findAll(): Promise<AppEvent[]> {
    return this.appEventRepository.find({ relations: ['user', 'app'] });
  }

  @LogMethod()
  async findOne(id: number): Promise<AppEvent | null> {
    return this.appEventRepository.findOne({
      where: { id },
      relations: ['user', 'app'],
    });
  }

  @LogMethod()
  async findAllByUser(user: User): Promise<AppEvent[]> {
    return this.appEventRepository.find({
      where: { user: { id: user.id } },
      relations: ['user', 'app'],
    });
  }

  @LogMethod()
  async findMostRecentNByAppIdAndUserId(
    appId: number,
    userId: number,
    n: number,
  ): Promise<AppEvent[]> {
    return this.appEventRepository.find({
      where: { app: { id: appId }, user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: n,
      relations: ['user', 'app'],
    });
  }
}
