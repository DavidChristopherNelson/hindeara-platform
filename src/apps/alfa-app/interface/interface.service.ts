import { Injectable } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';
import { ActorRefFrom, createActor } from 'xstate';
import { lessonMachine } from '../state/state.machine';
import { MiniLesson } from '../mini-lessons/entities/mini-lesson.entity';
import { UserEvent } from 'src/hindeara-platform/user-events/entities/user-event.entity';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 1;

  constructor(
    private readonly appEventsService: AppEventsService,
    private readonly miniLessonsService: MiniLessonsService,
    private readonly userEventsService: UserEventsService,
  ) {}

  @LogMethod()
  async run(userId: number): Promise<CreateAppEventDto> {
    // Get previous states
    const latestUserEvent =
      await this.userEventsService.findMostRecentByUserId(userId);
    if (!latestUserEvent) {
      throw new Error('Cannot find a UserEvent associated with this User.');
    }
    const appEvents =
      await this.appEventsService.findMostRecentNByAppIdAndUserId(
        this.appId,
        userId,
        2,
      );
    const [latestAppEvent, secondLatestAppEvent] = appEvents;

    // Guard clause for the initial startup edge case.
    if (!latestAppEvent) {
      await this.miniLessonsService.create({
        appEventId: 0,
        userId,
        word: 'dummy word',
        state: createActor(lessonMachine).start().getPersistedSnapshot(),
      });
      const createAppEventDto: CreateAppEventDto = {
        recording: 'dummy recording',
        uiData: 'dummy uiData',
        isComplete: false,
      };
      return createAppEventDto;
    }
    const latestMiniLesson = await this.miniLessonsService.findLatestMiniLesson(
      latestAppEvent,
      secondLatestAppEvent,
      userId,
    );

    // Calculate new state
    const answerStatus = this.evaluateAnswer(latestUserEvent, latestMiniLesson);
    const lessonActor: ActorRefFrom<typeof lessonMachine> = createActor(
      lessonMachine,
      { snapshot: latestMiniLesson.state },
    ).start();
    lessonActor.send(answerStatus);

    // Save state
    await this.miniLessonsService.create({
      appEventId: latestAppEvent?.id ?? 0,
      userId,
      word: 'dummy word',
      state: lessonActor.getPersistedSnapshot(),
    });

    // Pass state to Hindeara Platform
    const createAppEventDto: CreateAppEventDto = {
      recording: 'dummy recording',
      uiData: 'dummy uiData',
      isComplete: false,
    };
    return createAppEventDto;
  }

  @LogMethod()
  evaluateAnswer(
    latestUserEvent: UserEvent,
    latestMiniLesson: MiniLesson,
  ):
    | { type: 'CORRECT_ANSWER' }
    | { type: 'INCORRECT_ANSWER' }
    | { type: 'START_LESSON' } {
    // Handle the initial startup edge case.
    if (latestMiniLesson.appEventId === 0) {
      return { type: 'START_LESSON' };
    }

    // Handle the normal case.
    return Math.random() < 0.5
      ? { type: 'CORRECT_ANSWER' }
      : { type: 'INCORRECT_ANSWER' };
  }
}
