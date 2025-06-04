import { Injectable } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';
import { ActorRefFrom, createActor } from 'xstate';
import {
  getIndex,
  getPrompt,
  getWord,
  lessonMachine,
} from '../state/state.machine';
import { UserEvent } from 'src/hindeara-platform/user-events/entities/user-event.entity';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';
import { PhonemesService } from '../phonemes/phonemes.service';
import { UiDataDto } from './dto/ui-data.dto';

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 1;

  constructor(
    private readonly appEventsService: AppEventsService,
    private readonly miniLessonsService: MiniLessonsService,
    private readonly userEventsService: UserEventsService,
    private readonly chatgptService: ChatGPTService,
    private readonly phonemeService: PhonemesService,
  ) {}

  @LogMethod()
  async run(userId: number): Promise<CreateAppEventDto> {
    // Get previous states
    const ctx = await this.buildContext(userId);

    // Calculate new state
    const answerStatus = await this.evaluateAnswer(ctx);
    ctx.lessonActor.send(answerStatus);

    // Generate return data
    const word: string = getWord(ctx.lessonActor);
    const letter: string = word[getIndex(ctx.lessonActor)];
    const picture: string = (await this.phonemeService.findByLetter(letter)).example_image;
    const uiData: UiDataDto = { word, letter, picture };
    const recording = await this.chatgptService.sendMessage(
      getPrompt(ctx.lessonActor),
    );

    // Persist the new state and respond
    await this.miniLessonsService.create({
      appEventId: ctx.latestAppEvent ? ctx.latestAppEvent.id : 0,
      userId: ctx.userId,
      word: getWord(ctx.lessonActor),
      state: ctx.lessonActor.getPersistedSnapshot(),
    });
    return {
      recording: recording.toString(),
      uiData: JSON.stringify(uiData),
      isComplete: false,
    };
  }

  @LogMethod()
  private async persistLesson(
    actor: ActorRefFrom<typeof lessonMachine>,
    appEventId: number,
    userId: number,
  ) {
    await this.miniLessonsService.create({
      appEventId,
      userId,
      word: getWord(actor),
      state: actor.getPersistedSnapshot(),
    });
  }

  @LogMethod()
  private async evaluateAnswer(ctx: {
    readonly userId: number;
    readonly latestUserEvent: UserEvent | null;
    readonly latestAppEvent: AppEvent | undefined;
    readonly lessonActor: ActorRefFrom<typeof lessonMachine>;
    readonly isFirstRun: boolean;
  }): Promise<
    | { type: 'CORRECT_ANSWER' }
    | { type: 'INCORRECT_ANSWER' }
    | { type: 'START_OF_LESSON' }
  > {
    if (!this.doesValidLessonExist(ctx.userId, ctx.latestAppEvent))
      return { type: 'START_OF_LESSON' };
    if (!ctx.latestAppEvent) return { type: 'START_OF_LESSON' };
    if (!ctx.latestUserEvent) return { type: 'START_OF_LESSON' };

    const prompt = `
      The student was asked the question: ${ctx.latestAppEvent.recording}
      The student was shown the following UI data on their phone: ${ctx.latestAppEvent.uiData}
      The student's answer is ${ctx.latestUserEvent.recording}
      Please be strict, here are some examples of being strict. 
      If the image is tiger.png the student's answer must have the word tiger in it (not 'animal', 'big cat', etc). 
      If the word to be read is 'cat' the student's answer must have the word 'cat' in it. 
      Is the student's answer correct?
      `;
    const answer = await this.chatgptService.sendMessage(
      prompt,
      'You are a teacher that cares deeply about exact answers.',
      'boolean',
    );
    return answer ? { type: 'CORRECT_ANSWER' } : { type: 'INCORRECT_ANSWER' };
  }

  @LogMethod()
  private async buildContext(userId: number): Promise<{
    readonly userId: number;
    readonly latestUserEvent: UserEvent | null;
    readonly latestAppEvent: AppEvent | undefined;
    readonly lessonActor: ActorRefFrom<typeof lessonMachine>;
    readonly isFirstRun: boolean;
  }> {
    const [latestUserEvent, recentAppEvents] = await Promise.all([
      this.userEventsService.findMostRecentByUserId(userId),
      this.appEventsService.findMostRecentNByAppIdAndUserId(
        this.appId,
        userId,
        2,
      ),
    ]);
    const [latestAppEvent, secondLatest] = recentAppEvents;

    // Handle the case where no valid lesson exists.
    let lessonActor: ActorRefFrom<typeof lessonMachine>;
    if (this.doesValidLessonExist(userId, latestAppEvent)) {
      const latestMiniLesson =
        await this.miniLessonsService.findLatestMiniLesson(
          secondLatest,
          userId,
        );
      lessonActor = createActor(lessonMachine, {
        snapshot: latestMiniLesson.state,
      }).start();
    } else {
      lessonActor = createActor(lessonMachine).start();
    }

    return {
      userId,
      latestUserEvent,
      latestAppEvent,
      lessonActor,
      isFirstRun: !latestAppEvent,
    } as const;
  }

  @LogMethod()
  private doesValidLessonExist(
    userId: number,
    latestAppEvent: AppEvent | undefined,
  ): boolean {
    // Is there a previous app event associated with both this app and user?
    if (!latestAppEvent) return false;

    // Is the previous app event completed?
    if (latestAppEvent.isComplete) return false;

    // Is the previous app event too stale?
    if (
      Date.now() - new Date(latestAppEvent.createdAt).getTime() >
      2 * 60 * 1000
    )
      return false;

    return true;
  }
}
