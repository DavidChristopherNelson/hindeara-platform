// src/apps/alfa-app/interface/interface.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';
import { ActorRefFrom, createActor } from 'xstate';
import {
  getIndex,
  getPrompt,
  getWord,
  getWrongCharacters,
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
  transcript: string | null;
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
    if (ctx.isLatestAppEventValid) {
      const correctAnswer = await this.getAnswer(ctx.lessonActor);
      const studentAnswer = ctx.transcript ?? '';
      ctx.lessonActor.send({ type: 'ANSWER', correctAnswer, studentAnswer });
    }

    // Generate return data
    const state = ctx.lessonActor.getSnapshot().value;
    const word: string = getWord(ctx.lessonActor);
    const wrongCharacters: string[] = getWrongCharacters(ctx.lessonActor);
    const letter: string = wrongCharacters[getIndex(ctx.lessonActor)];
    const phoneme = await this.phonemesService.findByLetter(letter);
    if (!phoneme) throw new Error('Unable to find phoneme.');
    const picture: string = phoneme.example_image;
    const deployCheck: string = '1';
    const uiData: UiDataDto = {
      word,
      letter,
      picture,
      state,
      transcript: ctx.transcript,
      wrongCharacters,
      deployCheck,
    };

    const recording = await this.chatgptService.sendMessage({
      userPrompt: `
        For context this was the student's previous response: ${ctx.transcript}. 
        ${getPrompt(ctx.lessonActor)}
        Please generate a unique response.
        ${await this.giveHint(ctx.lessonActor)}
        Your response must only contain the actual words you want to communicate to the student **and must not include any emojis or emoticons**.
        Your response must be less than 20 words. 
      `,
      locale: ctx.locale,
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
    let transcript: string | null = null;
    try {
      transcript = await this.chatgptService.transcribeAudio(
        latestUserEvent.recording,
        locale,
      );
    } catch (err) {
      /* Do not crash the flow – just log for later inspection */
      new Logger(AlfaAppInterfaceService.name).warn(
        `STT failed for user ${userId}: ${(err as Error).message}`,
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
      transcript,
    } as const;
  }

  @LogMethod()
  private async getAnswer(
    actor: ActorRefFrom<typeof lessonMachine>,
  ): Promise<string> {
    const snap = actor.getSnapshot();
    const word: string = getWord(actor);
    const wrongCharacters: string[] = getWrongCharacters(actor);
    const letter: string = wrongCharacters[getIndex(actor)];
    const phoneme = await this.phonemesService.findByLetter(letter);
    if (!phoneme) throw new Error('Unable to find phoneme.');
    const exampleNoun = phoneme.example_noun;

    switch (snap.value) {
      case 'word':
        return word;
      case 'letter':
        return letter;
      case 'image':
        return exampleNoun;
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
    const word = await this.chatgptService.sendMessage({
      userPrompt: `
        Generate a simple, common, three-letter noun for a 5-year-old child to 
        practice reading. Do not pick a word with any diacritics, matras, 
        bindus, or ligatures.
        ${words.length !== 0 ? `It must not be any of these words: ${words.toString()}.` : ''}
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
      .replace(/[^\p{L}\p{N}\s]|_/gu, '')
      .split(/\s+/)[0];
  }
}
