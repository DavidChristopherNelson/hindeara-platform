import { Injectable } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 1;

  constructor(
    private readonly appEventsService: AppEventsService,
    private readonly miniLessonsService: MiniLessonsService,
  ) {}

  async run(userId: number): Promise<CreateAppEventDto> {
    // Get previous states
    const appEvents =
      await this.appEventsService.findMostRecentNByAppIdAndUserId(
        this.appId,
        userId,
        2,
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [latestAppEvent, secondLatestAppEvent] = appEvents;
    // const latestUserEvent =
    //  await this.userEventsService.findMostRecentByUserId(userId);
    // const latestMiniLesson = await this.miniLessonsService.findByAppEventId(
    //   secondLatestAppEvent.id,
    // );
    // const latestState = latestMiniLesson.state;

    // Calculate new state
    //   Run state machine

    // Save state
    await this.miniLessonsService.create({
      appEventId: latestAppEvent.id,
      userId,
      word: 'dummy word',
      state: 'dummy state',
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
