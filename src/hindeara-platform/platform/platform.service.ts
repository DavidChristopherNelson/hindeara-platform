import { Injectable } from '@nestjs/common';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { AppsService } from '../apps/apps.service';
import { AlfaAppInterfaceService } from 'src/apps/alfa-app/interface/interface.service';
import { CreateAppEventDto } from '../app-events/dto/create-app-event.dto';
import { App } from '../apps/entities/app.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { CreateUserEventDto } from '../user-events/dto/create-user-event.dto';

@Injectable()
export class PlatformService {
  constructor(
    private readonly userEventsService: UserEventsService,
    private readonly appEventsService: AppEventsService,
    private readonly appsService: AppsService,
    private readonly alfaAppInterface: AlfaAppInterfaceService,
  ) {}

  @LogMethod()
  async processUserInput(
    user: User,
    recording: string,
    locale: string,
  ): Promise<AppEvent> {
    // create user event
    const createUserEventDto: CreateUserEventDto = { recording, locale };
    await this.userEventsService.create(createUserEventDto, user);

    // find and run current app
    const currentApp = await this.findCurrentApp(user);
    const createAppEventDto: CreateAppEventDto = await this.runApp(
      user,
      currentApp,
    );

    // create app event
    const appEvent = await this.appEventsService.create(
      createAppEventDto,
      locale,
      user,
      currentApp,
    );

    return appEvent;
  }

  @LogMethod()
  async findCurrentApp(user: User): Promise<App> {
    const pastAppEvents: AppEvent[] =
      await this.appEventsService.findAllByUser(user);
    if (pastAppEvents.length === 0) {
      return this.chooseNewApp();
    }

    const fiveMinutesAgo = Date.now() - 5 * 60_000;
    const listOfCompletedApps: App[] = [];

    for (const appEvent of pastAppEvents) {
      if (appEvent.createdAt.getTime() < fiveMinutesAgo) {
        return this.chooseNewApp();
      }
      if (appEvent.isComplete) {
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

  // Put this in appsService
  @LogMethod()
  async chooseNewApp(): Promise<App> {
    const alfaApp = await this.appsService.findOne(1);
    if (!alfaApp) {
      return this.appsService.create({
        http_path: 'alfa-app',
        is_active: true,
      });
    }
    return alfaApp;
  }

  @LogMethod()
  async runApp(user: User, app: App): Promise<CreateAppEventDto> {
    switch (app.http_path) {
      case 'alfa-app': {
        const createAppEventDto = await this.alfaAppInterface.run(user.id);
        if (!createAppEventDto) {
          throw new Error(`App not found: ${app.http_path}`);
        }
        return createAppEventDto;
      }
      default:
        throw new Error(`App not found: ${app.http_path}`);
    }
  }
}
