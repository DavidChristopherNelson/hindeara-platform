import { Injectable } from '@nestjs/common';
import { CreateUserEventDto } from './dto/create-user-event.dto';
import { UserEvent } from './entities/user-event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

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

  @LogMethod()
  async findAll(): Promise<UserEvent[]> {
    return this.userEventRepository.find();
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
}
