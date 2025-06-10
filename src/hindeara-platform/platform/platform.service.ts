import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/hindeara-platform/users/users.service';
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

type UserOrUserId =
  | { user: User; userId?: never }
  | { user?: never; userId: number };

@Injectable()
export class PlatformService {
  constructor(
    private readonly usersService: UsersService,
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
    const validAppEvent = await this.findMostRecentValidAppEvent({ user });
    const currentApp =
      validAppEvent?.app ?? (await this.appsService.chooseNewApp());
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

  /*
  An AppEvent instance is valid if it is the most recent AppEvent instance of
  an incomplete chain of AppEvent instances for a given app. Put another way. 
  If there is an alfa method lesson going on, the latest AppEvent instance in 
  that lesson will be valid. There can be zero, one or many valid AppEvent 
  instance per user. But no two valid AppEvent instances will belong to the 
  same app. 

  Here are all the ways an AppEvent instance can be invalid.
  * Too stale: the AppEvent instance was created too long ago.
  * Wrong language: When the user switches language all AppEvent instances
      in the previous language become invalid.
  * There is a more recent AppEvent instance that matches user, app and locale.
  */
  @LogMethod()
  async findMostRecentValidAppEvent(
    params: UserOrUserId,
  ): Promise<AppEvent | null> {
    const user =
      params.user ?? (await this.usersService.findOne(params.userId));
    if (!user) throw new Error('Unable to find user.');
    const locale = await this.currentLocale({ user });
    // Todo: convert this into a global variable.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();

    const allPotentiallyValidAppEvents = await this.appEventsService.findAll({
      userId: user.id,
      since: fiveMinutesAgo,
      locale: locale,
    });

    const seenAppIds = new Set<number>();
    for (const appEvent of allPotentiallyValidAppEvents) {
      if (seenAppIds.has(appEvent.appId)) continue;
      seenAppIds.add(appEvent.appId);
      if (appEvent.event_isComplete) continue;

      return this.appEventsService.findOne(appEvent.event_id);
    }
    return null;
  }

  async isAppEventValid(appEvent: AppEvent) {
    const user = appEvent.user;
    const currentLocale = await this.currentLocale({ user });
    if (currentLocale !== appEvent.locale) return null;
    if (appEvent.isComplete) return null;

    const findInvalidatingAppEvents = await this.appEventsService.findAll({
      userId: appEvent.user.id,
      appId: appEvent.app.id,
      since: appEvent.createdAt.toISOString(),
      locale: appEvent.locale,
    });
    return findInvalidatingAppEvents.length === 0 ? appEvent : null;
  }

  @LogMethod()
  async currentLocale(params: UserOrUserId): Promise<string> {
    const user =
      params.user ?? (await this.usersService.findOne(params.userId));
    if (!user) throw new Error('Unable to find user.');

    const userEvent = await this.userEventsService.findMostRecentByUserId(
      user.id,
    );
    if (!userEvent) throw new Error('Unable to find latest userEvent.');
    return userEvent.locale;
  }
}
