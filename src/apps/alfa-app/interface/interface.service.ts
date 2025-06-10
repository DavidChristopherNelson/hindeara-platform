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
import { UtilsService } from 'src/common/utils.service';

type LessonContext = Readonly<{
  userId: number;
  latestUserEvent: UserEvent | null;
  latestAppEvent: AppEvent | undefined;
  lessonActor: ActorRefFrom<typeof lessonMachine>;
  isFirstRun: boolean;
  locale: string;
  isLatestAppEventValid: boolean;
}>;

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 1;

  constructor(
    private readonly appEventsService: AppEventsService,
    private readonly miniLessonsService: MiniLessonsService,
    private readonly userEventsService: UserEventsService,
    private readonly chatgptService: ChatGPTService,
    private readonly phonemesService: PhonemesService,
    private readonly utilsService: UtilsService,
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
    const phoneme = await this.phonemesService.findByLetter(letter);
    if (!phoneme) throw new Error('Unable to find phoneme.');
    const picture: string = phoneme.example_image;
    const uiData: UiDataDto = { word, letter, picture, state };
    const recording = await this.chatgptService.sendMessage({
      userPrompt: `
        For context this was the previous question that the student was asked: ${ctx.latestAppEvent?.recording}. 
        And this is the student's previous response: ${ctx.latestUserEvent?.recording}. 
        The student's previous response is ${JSON.stringify(answerStatus)}.
        ${getPrompt(ctx.lessonActor)}
        Please generate a unique response.
        ${await this.giveHint(ctx.lessonActor)}
        Your response must only contain the actual words you want to communicate to the student.
      `,
    });

    // Persist the new state and respond
    await this.miniLessonsService.create({
      appEventId: ctx.latestAppEvent?.id ?? 0,
      userId: ctx.userId,
      word,
      locale: ctx.locale,
      state: ctx.lessonActor.getPersistedSnapshot(),
      phonemeId:
        state === 'letter' || state === 'letterImage' ? phoneme.id : undefined,
    });
    return {
      recording: recording.toString(),
      uiData: JSON.stringify(uiData),
      isComplete: state === 'complete' ? true : false,
    };
  }

  @LogMethod()
  private async buildContext(userId: number): Promise<LessonContext> {
    const [latestUserEvent, [latestAppEvent, secondLatest], locale] =
      await Promise.all([
        this.userEventsService.findMostRecentByUserId(userId),
        this.appEventsService.findMostRecentNByAppIdAndUserId(
          this.appId,
          userId,
          2,
        ),
        this.utilsService.currentLocale({ userId }),
      ]);
    if (!latestUserEvent) {
      throw new Error(
        'No latestUserEvent found. This should not have happened.',
      );
    }

    // If there is a valid lesson then use it's state otherwise create a new
    // lesson.
    const isLatestAppEventValid =
      !!(await this.utilsService.isAppEventValid(latestAppEvent));
    let lessonActor: ActorRefFrom<typeof lessonMachine>;
    if (isLatestAppEventValid) {
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
        input: { word: await this.generateWord(userId, locale) },
      }).start();
    }

    return {
      userId,
      latestUserEvent,
      latestAppEvent,
      lessonActor,
      isFirstRun: !latestAppEvent,
      locale,
      isLatestAppEventValid,
    } as const;
  }

  @LogMethod()
  private async evaluateAnswer(
    ctx: LessonContext,
  ): Promise<
    | { type: 'CORRECT_ANSWER' }
    | { type: 'INCORRECT_ANSWER' }
    | { type: 'START_OF_LESSON' }
  > {
    if (!ctx.isLatestAppEventValid) return { type: 'START_OF_LESSON' };
    if (!ctx.latestAppEvent) return { type: 'START_OF_LESSON' };
    if (!ctx.latestUserEvent) return { type: 'START_OF_LESSON' };
    const prompt = `
      Target token: "${await this.getAnswer(ctx.lessonActor)}".
      Student's answer: "${ctx.latestUserEvent.recording}".
      Is the student's answer correct?
      `;
    const answer = await this.chatgptService.sendMessage({
      userPrompt: prompt,
      roleContent:
        'You grade with exactness but ignore surrounding punctuation. \
        A student answer is correct iff, after lower-casing and stripping punctuation, \
        it contains the exact target token (or group of tokens) as a separate token (or group of tokens).',
      model: 'gpt-4o-mini',
      tool: 'boolean',
      locale: ctx.locale,
    });
    return answer ? { type: 'CORRECT_ANSWER' } : { type: 'INCORRECT_ANSWER' };
  }

  @LogMethod()
  private async getAnswer(
    actor: ActorRefFrom<typeof lessonMachine>,
  ): Promise<string> {
    const snap = actor.getSnapshot();
    const word = snap.context.word;
    const letter = word[snap.context.index];
    const phoneme = await this.phonemesService.findByLetter(letter);
    if (!phoneme) throw new Error('Unable to find phoneme.');
    const image = phoneme.example_image.replace(/\.[^.]+$/, '');

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
  private async generateWord(userId: number, locale: string): Promise<string> {
    const words = await this.miniLessonsService.findAllWordsByUserIdAndLocale(
      userId,
      locale,
    );
    const letters =
      await this.miniLessonsService.findAllLettersByUserIdAndLocale(
        userId,
        locale,
      );
    const word = await this.chatgptService.sendMessage({
      userPrompt: `
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
      roleContent:
        'You are a helpful assistant that must strictly follow letter-based logic rules.',
      model: 'gpt-4o',
      locale,
    });
    return word
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]|_/g, '')
      .split(/\s+/)[0];
  }
}
