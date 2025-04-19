import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from './entities/app.entity';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
    private readonly appEventsService: AppEventsService,
    private readonly httpService: HttpService,
  ) {}

  async create(createAppDto: CreateAppDto): Promise<App> {
    const app = this.appRepository.create(createAppDto);
    return this.appRepository.save(app);
  }

  async findAll(): Promise<App[]> {
    return this.appRepository.find();
  }

  async findOne(id: number): Promise<App | null> {
    return this.appRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAppDto: UpdateAppDto): Promise<App | null> {
    const result = await this.appRepository.update(id, updateAppDto);
    if (result.affected === 0) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    return this.findOne(id);
  }

  async findCurrentApp(user: User): Promise<App> {
    const pastAppEvents: AppEvent[] =
      await this.appEventsService.findAllByUser(user);

    const fiveMinutesAgo = Date.now() - 5 * 60_000;
    const listOfCompletedApps: App[] = [];

    for (const appEvent of pastAppEvents) {
      if (appEvent.createdAt.getTime() < fiveMinutesAgo) {
        return this.chooseNewApp();
      }
      if (appEvent.is_complete) {
        listOfCompletedApps.push(appEvent.app);
        continue;
      }
      if (listOfCompletedApps.includes(appEvent.app)) {
        return this.chooseNewApp();
      }
      return appEvent.app;
    }

    console.warn(
      'Warning: findCurrentApp() did not return from the loop. This should not have happened. Returning a fallback app.',
    );
    return this.chooseNewApp();
  }

  async chooseNewApp(): Promise<App> {
    const alfaApp = await this.findOne(1);
    if (!alfaApp) {
      return this.create({
        http_path: 'https://alfa.com',
        is_active: true,
      });
    }
    return alfaApp;
  }

  async runApp(user: User, app: App): Promise<CreateAppEventDto> {
    const url = `${app.http_path}/users/${user.id}/run`;
    const resp: AxiosResponse<CreateAppEventDto> = await firstValueFrom(
      this.httpService.post<CreateAppEventDto>(url),
    );
    return resp.data;
  }
}
