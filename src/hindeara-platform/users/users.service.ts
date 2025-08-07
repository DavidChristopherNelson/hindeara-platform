// src/hindeara-platform/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @LogMethod()
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { phoneNumber: createUserDto.phoneNumber },
    });
    if (existing) return existing;
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  @LogMethod()
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  @LogMethod()
  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  @LogMethod()
  async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }

  @LogMethod()
  async update(user: User, updateUserDto: UpdateUserDto): Promise<User> {
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  @LogMethod()
  async remove(user: User): Promise<void> {
    await this.userRepository.delete(user.id);
  }
}
