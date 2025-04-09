import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HindearaEvent } from './entities/hindeara-event.entity';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';

@Injectable()
export class HindearaEventsService {
  constructor(
    @InjectRepository(HindearaEvent)
    private readonly hindearaEventRepository: Repository<HindearaEvent>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createHindearaEventDto: CreateHindearaEventDto,
  ): Promise<HindearaEvent> {
    const user = await this.usersService.findOne(createHindearaEventDto.userId);
    if (!user) {
      throw new NotFoundException(
        `User with id ${createHindearaEventDto.userId} not found`,
      );
    }

    const hindearaEvent = this.hindearaEventRepository.create(
      createHindearaEventDto,
    );
    return this.hindearaEventRepository.save(hindearaEvent);
  }

  async findAll(): Promise<HindearaEvent[]> {
    return this.hindearaEventRepository.find();
  }

  async findOne(id: number): Promise<HindearaEvent | null> {
    return this.hindearaEventRepository.findOne({ where: { id: id } });
  }
}
