import { Injectable } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';
//import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 1;

  constructor(
    private readonly appEventsService: AppEventsService,
    private readonly miniLessonsService: MiniLessonsService,
    //private readonly userEventsService: UserEventsService,
  ) {}

  async run(userId: number): Promise<CreateAppEventDto> {
    // Get previous states
    // const latestUserEvent =
    //   await this.userEventsService.findMostRecentByUserId(userId);
    const appEvents =
      await this.appEventsService.findMostRecentNByAppIdAndUserId(
        this.appId,
        userId,
        2,
      );
    const [latestAppEvent, secondLatestAppEvent] = appEvents;
    const latestMiniLesson = await this.miniLessonsService.findLatestMiniLesson(
      latestAppEvent,
      secondLatestAppEvent,
      userId,
    );

    // Calculate new state
    // const latestState = latestMiniLesson.state;
    //   Run state machine

    // Save state
    await this.miniLessonsService.create({
      appEventId: latestAppEvent?.id ?? 0,
      userId,
      word: 'dummy word',
      state: `dummy state + ${latestMiniLesson.state}`,
    });

    // Pass state to Hindeara Platform
    const createAppEventDto: CreateAppEventDto = {
      recording: 'dummy recording',
      uiData: 'dummy uiData',
      isComplete: false,
    };
    return createAppEventDto;
  }
}
