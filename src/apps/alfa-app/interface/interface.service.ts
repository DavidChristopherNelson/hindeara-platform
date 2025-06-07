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

type LessonContext = Readonly<{
  userId: number;
  latestUserEvent: UserEvent | null;
  latestAppEvent: AppEvent | undefined;
  lessonActor: ActorRefFrom<typeof lessonMachine>;
  isFirstRun: boolean;
}>;

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
    const state = ctx.lessonActor.getSnapshot().value;
    const word: string = getWord(ctx.lessonActor);
    const letter: string = word[getIndex(ctx.lessonActor)];
    const picture: string = (await this.phonemeService.findByLetter(letter))
      .example_image;
    const uiData: UiDataDto = { word, letter, picture, state };
    const recording = await this.chatgptService.sendMessage(
      `
        For context this was the previous question that the student was asked: ${ctx.latestAppEvent?.recording}. 
        And this is the student's previous response: ${ctx.latestUserEvent?.recording}. 
        The student's previous response is ${JSON.stringify(answerStatus)}.
        ${getPrompt(ctx.lessonActor)}
        Please generate a unique response.
        ${await this.giveHint(ctx.lessonActor)}
        Your response must only contain the actual words you want to communicate to the student.
      `,
    );

    // Persist the new state and respond
    await this.miniLessonsService.create({
      appEventId: ctx.latestAppEvent?.id ?? 0,
      userId: ctx.userId,
      word,
      state: ctx.lessonActor.getPersistedSnapshot(),
      phonemeId:
        state === 'letter' || state === 'letterImage'
          ? (await this.phonemeService.findByLetter(letter))?.id
          : undefined,
    });
    return {
      recording: recording.toString(),
      uiData: JSON.stringify(uiData),
      isComplete: state === 'complete' ? true : false,
    };
  }

  @LogMethod()
  private async buildContext(userId: number): Promise<LessonContext> {
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
      lessonActor = createActor(lessonMachine, {
        input: { word: await this.generateWord(userId) },
      }).start();
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

  @LogMethod()
  private async evaluateAnswer(
    ctx: LessonContext,
  ): Promise<
    | { type: 'CORRECT_ANSWER' }
    | { type: 'INCORRECT_ANSWER' }
    | { type: 'START_OF_LESSON' }
  > {
    if (!this.doesValidLessonExist(ctx.userId, ctx.latestAppEvent))
      return { type: 'START_OF_LESSON' };
    if (!ctx.latestAppEvent) return { type: 'START_OF_LESSON' };
    if (!ctx.latestUserEvent) return { type: 'START_OF_LESSON' };
    const prompt = `
      Target token: "${await this.getAnswer(ctx.lessonActor)}".
      Student's answer: "${ctx.latestUserEvent.recording}".
      Is the student's answer correct?
      `;
    const answer = await this.chatgptService.sendMessage(
      prompt,
      'You grade with exactness but ignore surrounding punctuation. \
      A student answer is correct iff, after lower-casing and stripping punctuation, \
      it contains the exact target token (or group of tokens) as a separate token (or group of tokens).',
      'gpt-4o-mini',
      'boolean',
    );
    return answer ? { type: 'CORRECT_ANSWER' } : { type: 'INCORRECT_ANSWER' };
  }

  @LogMethod()
  private async getAnswer(
    actor: ActorRefFrom<typeof lessonMachine>,
  ): Promise<string> {
    const snap = actor.getSnapshot();
    const word = snap.context.word;
    const letter = word[snap.context.index];
    const image = (
      await this.phonemeService.findByLetter(letter)
    ).example_image.replace(/\.[^.]+$/, '');

    switch (snap.value) {
      case 'word':
        return word;
      case 'letter':
        return letter;
      case 'image':
        return image;
      case 'letterImage':
        return letter;
      default:
        return '';
    }
  }

  @LogMethod()
  private async giveHint(
    actor: ActorRefFrom<typeof lessonMachine>,
  ): Promise<string> {
    const snap = actor.getSnapshot();
    switch (snap.value) {
      case 'image':
        return `Please give a hint 50% of the time. The answer is "${await this.getAnswer(actor)}". Do not include the string "${await this.getAnswer(actor)}" in your response.`;
      default:
        return '';
    }
  }

  @LogMethod()
  private async generateWord(userId: number): Promise<string> {
    const words = await this.miniLessonsService.findAllWordsByUserId(userId);
    const letters =
      await this.miniLessonsService.findAllLettersByUserId(userId);
    const word = await this.chatgptService.sendMessage(
      `
        Generate a simple, common, three-letter noun for a 5-year-old child.

        Constraints:
        - It must NOT be any of these words: ${words.toString()}.
        - It must contain **exactly TWO** letters from this list: ${letters.toString()}
        - It must contain **exactly ONE** letter NOT from this list: ${letters.toString()}

        Step-by-step:
        1. Generate candidate words.
        2. Check which letters are in the allowed list.
        3. Ensure the there are two letters in the list and one not in the list.
        4. Confirm it's not excluded.
        
        Only if the word satisfies all the rules give the response.
        The response must only contain the chosen word.
      `,
      'You are a helpful assistant that must strictly follow letter-based logic rules.',
      'gpt-4o',
    );
    return word
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]|_/g, '')
      .split(/\s+/)[0];
  }
}
