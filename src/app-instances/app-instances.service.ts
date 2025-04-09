import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';
import { Repository } from 'typeorm';
import { AppInstance } from './entities/app-instance.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HindearaEventsService } from '../hindeara-events/hindeara-events.service';
import { AppsService } from '../apps/apps.service';

@Injectable()
export class AppInstancesService {
  constructor(
    @InjectRepository(AppInstance)
    private readonly appInstanceRepository: Repository<AppInstance>,
    private readonly hindearaEventsService: HindearaEventsService,
    private readonly appsService: AppsService,
  ) {}

  async create(
    createAppInstanceDto: CreateAppInstanceDto,
  ): Promise<AppInstance> {
    // Check if the HindearaEvent exists
    const hindearaEvent = await this.hindearaEventsService.findOne(
      createAppInstanceDto.hindearaEventId,
    );
    if (!hindearaEvent) {
      throw new NotFoundException(
        `HindearaEvent with id ${createAppInstanceDto.hindearaEventId} not found`,
      );
    }

    // Check if the App exists
    const app = await this.appsService.findOne(createAppInstanceDto.appId);
    if (!app) {
      throw new NotFoundException(
        `App with id ${createAppInstanceDto.appId} not found`,
      );
    }

    // Create the AppInstance
    const appInstance = this.appInstanceRepository.create(createAppInstanceDto);
    return this.appInstanceRepository.save(appInstance);
  }

  async findAll(): Promise<AppInstance[]> {
    return this.appInstanceRepository.find();
  }

  async findOne(id: number): Promise<AppInstance | null> {
    return this.appInstanceRepository.findOne({ where: { id } });
  }
}
