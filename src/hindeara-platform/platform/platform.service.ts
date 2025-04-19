import { Injectable } from '@nestjs/common';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { Builder } from 'src/hindeara-platform/app-events/dto/buildDto';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';

@Injectable()
export class PlatformService {
  constructor(
    private readonly userEventsService: UserEventsService,
    private readonly builder: Builder,
    private readonly appEventsService: AppEventsService,
  ) {}

  async processUserInput(user: User, recording: string): Promise<AppEvent> {
    // create user event
    const createUserEventDto = { recording: recording };
    await this.userEventsService.create(createUserEventDto, user);

    // create app event
    const createAppEventDto = await this.builder.createDtoFromUserId(user);
    const appEvent = await this.appEventsService.create(
      createAppEventDto,
      user,
    );

    return appEvent;
  }
}
