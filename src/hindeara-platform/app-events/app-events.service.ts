// src/hindeara-platform/app-events/app-events.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAppEventDto } from './dto/create-app-event.dto';
import { AppEvent } from './entities/app-event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { App } from '../apps/entities/app.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { findAllFilter } from './dto/find-all-filter.dto';

interface RawAppEventWithIds {
  event_id: number;
  event_recording: string;
  event_locale: string;
  event_uiData: string;
  event_isComplete: 0 | 1;
  event_createdAt: Date;

  userId: number;
  appId: number;
}

export interface AppEventWithIds
  extends Omit<RawAppEventWithIds, 'event_isComplete'> {
  event_isComplete: boolean; // mapped to boolean before return
}

@Injectable()
export class AppEventsService {
  constructor(
    @InjectRepository(AppEvent)
    private appEventRepository: Repository<AppEvent>,
  ) {}

  @LogMethod()
  async create(
    createAppEventDto: CreateAppEventDto,
    locale: string,
    user: User,
    app: App,
  ): Promise<AppEvent> {
    const createdAppEvent = this.appEventRepository.create({
      ...createAppEventDto,
      locale,
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
  async findAll(filter: findAllFilter): Promise<AppEventWithIds[]> {
    /* build query -------------------------------------------------- */
    const qb = this.appEventRepository
      .createQueryBuilder('event')
      .leftJoin('event.user', 'user')
      .leftJoin('event.app', 'app')
      .select('event')
      .addSelect('user.id', 'userId')
      .addSelect('app.id', 'appId');

    /* dynamic filters ---------------------------------------------- */
    if (filter.userId !== undefined) {
      qb.andWhere('user.id = :userId', { userId: filter.userId });
    }
    if (filter.since !== undefined) {
      qb.andWhere('event.createdAt > :since', { since: filter.since });
    }
    if (filter.appId !== undefined) {
      qb.andWhere('app.id = :appId', { appId: filter.appId });
    }
    if (filter.locale !== undefined) {
      qb.andWhere('event.locale = :locale', { locale: filter.locale });
    }

    /* execute & map ------------------------------------------------- */
    const rawRows = await qb
      .orderBy('event.createdAt', 'DESC')
      .getRawMany<RawAppEventWithIds>();

    // very cheap in-memory map: 0|1 → boolean
    const returnValue = rawRows.map(({ event_isComplete, ...rest }) => ({
      ...rest,
      event_isComplete: Boolean(event_isComplete),
    }));

    // Hack: the filter is acting like <= instead of < so I have to filter it out here instead.
    if (
      filter.since &&
      returnValue[0]?.event_createdAt.getTime() === filter.since.getTime()
    ) {
      return [];
    }

    return returnValue;
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
