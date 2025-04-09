import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HindearaEvent } from './entities/hindeara-event.entity';
import { UsersService } from '../users/users.service';
import { NotFoundException } from '@nestjs/common';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';

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
      throw new NotFoundException('User not found');
    }
    const event = this.hindearaEventRepository.create({
      ...createHindearaEventDto,
      user,
    });
    return this.hindearaEventRepository.save(event);
  }

  async findAll(): Promise<HindearaEvent[]> {
    return this.hindearaEventRepository.find();
  }

  async findOne(id: number): Promise<HindearaEvent | null> {
    return this.hindearaEventRepository.findOne({ where: { id } });
  }
}
