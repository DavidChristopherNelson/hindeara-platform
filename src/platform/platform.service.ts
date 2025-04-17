import { Injectable } from '@nestjs/common';
import { UserEventsService } from 'src/user-events/user-events.service';
import { Builder } from 'src/app-events/dto/buildDto';
import { AppEventsService } from 'src/app-events/app-events.service';
import { AppEvent } from 'src/app-events/entities/app-event.entity';

@Injectable()
export class PlatformService {
  constructor(
    private readonly userEventsService: UserEventsService,
    private readonly builder: Builder,
    private readonly appEventsService: AppEventsService,
  ) {}

  async processUserInput(userId: number, recording: string): Promise<AppEvent> {
    const createUserEventDto = { userId: userId, recording: recording };
    await this.userEventsService.create(createUserEventDto);
    const createAppEventDto = await this.builder.createDtoFromUserId(userId);
    const appEvent = await this.appEventsService.create(createAppEventDto);
    return appEvent;
  }
}
