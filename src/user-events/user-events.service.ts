import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserEventDto } from './dto/create-user-event.dto';
import { UserEvent } from './entities/user-event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UserEventsService {
  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    private readonly usersService: UsersService,
  ) {}

  async create(createUserEventDto: CreateUserEventDto): Promise<UserEvent> {
    const user = await this.usersService.findOne(createUserEventDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const event = this.userEventRepository.create({
      ...createUserEventDto,
      user,
    });
    return this.userEventRepository.save(event);
  }

  async findAll(): Promise<UserEvent[]> {
    return this.userEventRepository.find();
  }

  async findOne(id: number): Promise<UserEvent | null> {
    return this.userEventRepository.findOne({ where: { id } });
  }
}
