// src/apps/alfa-app/interface/interface.service.ts
import { Injectable } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';
import { ActorRefFrom, createActor } from 'xstate';
import {
  getPrompt,
  getWord,
  getWrongCharacters,
  getAnswer as getRawAnswer,
  lessonMachine,
  getAnswerStatus,
} from '../state/state.machine';
import { UserEvent } from 'src/hindeara-platform/user-events/entities/user-event.entity';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';
import { PhonemesService } from '../phonemes/phonemes.service';
import { UiDataDto } from './dto/ui-data.dto';
import { UtilsService } from 'src/common/utils.service';
import { UserPhonemeScoreService } from 'src/apps/alfa-app/score/score.service';

type LessonContext = Readonly<{
  userId: number;
  latestUserEvent: UserEvent;
  secondLatestUserEvent?: UserEvent;
  latestAppEvent: AppEvent | undefined;
  secondLatestAppEvent?: AppEvent | undefined;
  lessonActor: ActorRefFrom<typeof lessonMachine>;
  isFirstRun: boolean;
  locale: string;
  isLatestAppEventValid: boolean;
}>;

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 2;

  constructor(
    private readonly appEventsService: AppEventsService,
    private readonly miniLessonsService: MiniLessonsService,
    private readonly userEventsService: UserEventsService,
    private readonly chatgptService: ChatGPTService,
    private readonly phonemesService: PhonemesService,
    private readonly utilsService: UtilsService,
    private readonly userPhonemeScoreService: UserPhonemeScoreService,
  ) {}

  @LogMethod()
  async run(userId: number): Promise<CreateAppEventDto> {
    // Get previous states
    const ctx = await this.buildContext(userId);

    // Calculate new state
    if (ctx.isLatestAppEventValid) {
      await this.calculateNewState(ctx);
    }

    // Generate return data
    const state = ctx.lessonActor.getSnapshot().value;
    const word: string = getWord(ctx.lessonActor);
    const wrongCharacters: string[] = getWrongCharacters(ctx.lessonActor);
    const deployCheck: string = 'Deploy Check: 2a';
    const phonemeId = wrongCharacters[0]
      ? (await this.phonemesService.findByLetter(wrongCharacters[0]))?.id
      : undefined;
    const uiData: UiDataDto = {
      word,
      letter: wrongCharacters[0],
      picture: wrongCharacters[0]
        ? await this.phonemesService.getImage(wrongCharacters[0])
        : undefined,
      state,
      transcript: ctx.latestUserEvent.transcription ?? null,
      wrongCharacters,
      deployCheck,
    };

    const recording = await this.chatgptService.sendMessage({
      userPrompt: `
        For context here is the recent previous exchange between the app and the student
        ${getPrompt(ctx.lessonActor)}
        Please generate a unique response.
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
      phonemeId,
    });
    return {
      recording: recording.toString(),
      uiData: JSON.stringify(uiData),
      isComplete: state === 'complete' ? true : false,
    };
  }

  @LogMethod()
  private async calculateNewState(ctx: LessonContext): Promise<void> {
    const correctAnswer = await this.getAnswer(ctx);

    const studentAnswer = ctx.latestUserEvent.transcription ?? '';
    const previousState = ctx.lessonActor.getSnapshot().value;
    ctx.lessonActor.send({ type: 'ANSWER', correctAnswer, studentAnswer });
    const answerStatus = getAnswerStatus(ctx.lessonActor);

    // Update's phoneme's score
    if (previousState === 'letter') {
      // Get phoneme and delegate score update
      const phoneme = await this.phonemesService.findByLetter(correctAnswer);
      if (!phoneme) return;
      const isCorrect = answerStatus === true;
      await this.userPhonemeScoreService.updateScore(
        ctx.userId,
        phoneme.id,
        isCorrect,
      );
    }
  }

  @LogMethod()
  private async getAnswer(ctx: LessonContext): Promise<string> {
    let answer = getRawAnswer(ctx.lessonActor);
    if (ctx.lessonActor.getSnapshot().value === 'image') {
      answer = await this.phonemesService.getNoun(answer);
    }
    if (!answer) {
      throw new Error('Cannot find the correct answer.');
    }
    return answer;
  }

  @LogMethod()
  private async buildContext(userId: number): Promise<LessonContext> {
    const [
      [latestUserEvent, secondLatestUserEvent],
      [latestAppEvent, secondLatestAppEvent],
      locale,
    ] = await Promise.all([
      this.userEventsService.findMostRecentNByUserId(userId, 2),
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
          secondLatestAppEvent,
          userId,
        );
      lessonActor = createActor(lessonMachine, {
        snapshot: latestMiniLesson.state,
      }).start();
    } else {
      console.log('create a new lesson');
      lessonActor = createActor(lessonMachine, {
        input: { word: await this.generateWord(userId, locale) },
      }).start();
    }

    return {
      userId,
      latestUserEvent,
      secondLatestUserEvent,
      latestAppEvent,
      secondLatestAppEvent,
      lessonActor,
      isFirstRun: !latestAppEvent,
      locale,
      isLatestAppEventValid,
    } as const;
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
