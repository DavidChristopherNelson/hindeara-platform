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
    const latestUserEvent =
      await this.userEventsService.findMostRecentByUserId(userId);
    // Todo: Handle the case where there is no UserEvent.
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
        word: 'cat',
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
      secondLatestAppEvent,
      userId,
    );

    // Calculate new state
    const answerStatus = await this.evaluateAnswer(
      latestUserEvent,
      latestAppEvent,
    );
    const lessonActor: ActorRefFrom<typeof lessonMachine> = createActor(
      lessonMachine,
      { snapshot: latestMiniLesson.state },
    ).start();
    lessonActor.send(answerStatus);

    // Generate text response
    const snapshot = lessonActor.getSnapshot();
    const prompt = getPrompt(snapshot);
    const textResponse = await this.chatgptService.sendMessage(prompt);
    if (typeof textResponse !== 'string') {
      throw new Error(
        `Incorrectly formatted text response from AI. Expected string but instead got ${typeof textResponse}`,
      );
    }

    // Generate UI data
    const word = getWord(snapshot);
    const index = getIndex(snapshot);
    const uiData = {
      word,
      letter: word[index],
      picture: (await this.phonemeService.findByLetter(word[index]))
        .example_image,
    };

    // Save state
    await this.miniLessonsService.create({
      appEventId: latestAppEvent?.id ?? 0,
      userId,
      word,
      state: lessonActor.getPersistedSnapshot(),
    });

    // Pass state to Hindeara Platform
    const createAppEventDto: CreateAppEventDto = {
      recording: textResponse,
      uiData: JSON.stringify(uiData),
      isComplete: false,
    };
    return createAppEventDto;
  }

  @LogMethod()
  async evaluateAnswer(
    latestUserEvent: UserEvent,
    latestAppEvent: AppEvent,
  ): Promise<{ type: 'CORRECT_ANSWER' } | { type: 'INCORRECT_ANSWER' }> {
    const prompt = `
      The student was asked the question: ${latestAppEvent.recording}
      The student was shown the following UI data on their phone: ${latestAppEvent.uiData}
      The student's answer is ${latestUserEvent.recording}
      `;
    const answer = await this.chatgptService.sendMessage(
      prompt,
      'You are a teacher that cares deeply about truth.',
      'boolean',
    );
    return answer ? { type: 'CORRECT_ANSWER' } : { type: 'INCORRECT_ANSWER' };
  }
}
