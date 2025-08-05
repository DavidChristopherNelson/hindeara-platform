// src/common/utils.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/hindeara-platform/users/users.service';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { LogMethod } from './decorators/log-method.decorator';

export type UserOrUserId =
  | { user: User; userId?: never }
  | { user?: never; userId: number };

@Injectable()
export class UtilsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userEventsService: UserEventsService,
    private readonly appEventsService: AppEventsService,
  ) {}

  @LogMethod()
  async currentLocale(params: UserOrUserId): Promise<string> {
    const user =
      params.user ?? (await this.usersService.findOne(params.userId));
    if (!user) throw new Error('Unable to find user.');

    const latestEvent = await this.userEventsService.findMostRecentByUserId(
      user.id,
    );
    if (!latestEvent) throw new Error('Unable to find latest userEvent.');
    return latestEvent.locale;
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
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);

    const candidates = await this.appEventsService.findAll({
      userId: user.id,
      since: fiveMinutesAgo,
      locale,
    });

    const seenAppIds = new Set<number>();
    for (const appEvent of candidates) {
      if (seenAppIds.has(appEvent.appId)) continue;
      seenAppIds.add(appEvent.appId);
      if (appEvent.event_isComplete) continue;

      return this.appEventsService.findOne(appEvent.event_id);
    }
    return null;
  }

  @LogMethod()
  async isAppEventValid(appEvent: AppEvent | null): Promise<AppEvent | null> {
    if (!appEvent) return null;
    const locale = await this.currentLocale({ user: appEvent.user });
    if (locale !== appEvent.locale) return null;
    if (appEvent.isComplete) return null;
    const invalidatingAppEvents = await this.appEventsService.findAll({
      userId: appEvent.user.id,
      appId: appEvent.app.id,
      since: appEvent.createdAt,
      locale: appEvent.locale,
    });

    return invalidatingAppEvents.length === 0 ? appEvent : null;
  }
}
