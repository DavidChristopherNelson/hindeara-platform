// src/hindeara-platform/user-events/user-events.service.ts
import { Injectable } from '@nestjs/common';
import { CreateUserEventDto } from './dto/create-user-event.dto';
import { UserEvent } from './entities/user-event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { FindAllUserEventsFilter } from './dto/find-all-filter.dto';

interface RawUserEventWithIds {
  event_id: number;
  event_recording: Buffer;
  event_locale: string;
  event_transcription: string | null;
  event_createdAt: Date;
  userId: number;
}

export type UserEventWithIds = RawUserEventWithIds;

@Injectable()
export class UserEventsService {
  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
  ) {}

  @LogMethod()
  async create(
    createUserEventDto: CreateUserEventDto,
    user: User,
  ): Promise<UserEvent> {
    const event = this.userEventRepository.create({
      ...createUserEventDto,
      recording: Buffer.from(createUserEventDto.recording, 'base64'),
      user,
    });
    return this.userEventRepository.save(event);
  }

  /**
   * Generalized finder mirroring AppEventsService.findAll().
   * Filters: userId, since (strictly >), locale.
   * Returns raw rows with userId included.
   */
  @LogMethod()
  async findAll(
    filter: FindAllUserEventsFilter = {} as FindAllUserEventsFilter,
  ): Promise<UserEventWithIds[]> {
    const qb = this.userEventRepository
      .createQueryBuilder('event')
      .leftJoin('event.user', 'user')
      .select('event')
      .addSelect('user.id', 'userId');

    if (filter.userId !== undefined) {
      qb.andWhere('user.id = :userId', { userId: filter.userId });
    }
    if (filter.since !== undefined) {
      qb.andWhere('event.createdAt > :since', { since: filter.since });
    }
    if (filter.locale !== undefined) {
      qb.andWhere('event.locale = :locale', { locale: filter.locale });
    }

    const rawRows = await qb
      .orderBy('event.createdAt', 'DESC')
      .getRawMany<RawUserEventWithIds>();

    const returnValue: UserEventWithIds[] = rawRows.map((r) => ({ ...r }));

    // Match the AppEventsService equality guard for the "since" bug/workaround
    if (
      filter.since &&
      returnValue[0]?.event_createdAt.getTime() === filter.since.getTime()
    ) {
      return [];
    }

    return returnValue;
  }

  @LogMethod()
  async findOne(id: number): Promise<UserEvent | null> {
    return this.userEventRepository.findOne({ where: { id } });
  }

  @LogMethod()
  async findMostRecentByUserId(userId: number): Promise<UserEvent | null> {
    return this.userEventRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  @LogMethod()
  async findMostRecentNByUserId(
    userId: number,
    n: number,
  ): Promise<UserEvent[]> {
    return this.userEventRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: n,
      relations: ['user'], // eager-load user if you need it
    });
  }
}
