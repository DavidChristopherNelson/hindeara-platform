import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from './entities/app.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
  ) {}

  @LogMethod()
  async create(createAppDto: CreateAppDto): Promise<App> {
    const app = this.appRepository.create(createAppDto);
    return this.appRepository.save(app);
  }

  @LogMethod()
  async findAll(): Promise<App[]> {
    return this.appRepository.find();
  }

  @LogMethod()
  async findOne(id: number): Promise<App | null> {
    return this.appRepository.findOne({ where: { id } });
  }

  @LogMethod()
  async update(id: number, updateAppDto: UpdateAppDto): Promise<App | null> {
    const result = await this.appRepository.update(id, updateAppDto);
    if (result.affected === 0) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    return this.findOne(id);
  }
}
