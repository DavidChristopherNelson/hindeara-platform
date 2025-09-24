// src/apps/alfa-app/interface/interface.service.ts
import { Injectable } from '@nestjs/common';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { CreateAppEventDto } from 'src/hindeara-platform/app-events/dto/create-app-event.dto';
import { MiniLessonsService } from 'src/apps/alfa-app/mini-lessons/mini-lessons.service';
import { ActorRefFrom, createActor } from 'xstate';
import {
  getPrompt,
  getWord,
  getCorrectLetters,
  getWrongCharacters,
  getAnswer as getRawAnswer,
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
import { UserPhonemeScoreService } from 'src/apps/alfa-app/score/score.service';
import wordDataJson from '../phonemes/data/word-data.json';
import localWordDataJson from '../phonemes/data/word-data-local.json';

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

type WordPhoneme = { id: number };
type WordEntry = { word: string; phonemes: WordPhoneme[] };

@Injectable()
export class AlfaAppInterfaceService {
  private readonly appId = 1;
  private readonly wordData: ReadonlyArray<WordEntry> =
    ((process.env.NODE_ENV || 'development') === 'development'
      ? (localWordDataJson as WordEntry[])
      : (wordDataJson as WordEntry[]));

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
    const deployCheck: string = ' ';
    const phonemeId = wrongCharacters[0]
      ? (await this.phonemesService.findByLetter(wrongCharacters[0]))?.id
      : undefined;
    const rawUserScore = await this.userPhonemeScoreService.findAllForUser(ctx.userId);
    const userScore = rawUserScore
      .filter((item) => /[^\u0000-\u007F]/.test(item.letter))
      .map(({ letter, value }) => ({ letter, value: parseFloat(value) }))
      .sort((a, b) => a.value - b.value);
    const answerLetter = ctx.lessonActor.getSnapshot().context.answer?.charAt(0);
    const answerPhoneme = answerLetter ? 
      await this.phonemesService.findByLetter(answerLetter) :
      '';
    const exampleNoun = answerPhoneme && typeof answerPhoneme === 'object' ? 
      answerPhoneme.example_noun : 
      '';

    const uiData: UiDataDto = {
      word,
      letter: wrongCharacters[0],
      picture: wrongCharacters[0]
        ? await this.phonemesService.getImage(wrongCharacters[0])
        : undefined,
      state,
      transcript: '',
      wrongCharacters,
      deployCheck,
      userScore,
    };

    const recording = await this.chatgptService.sendMessage({
      userPrompt: `
        ${getPrompt(
          ctx.lessonActor,
          word,
          answerLetter,
          exampleNoun
        )}
        Please generate a unique response.
        DO NOT use any disrespectful language like तू , तूने, तुझे, or तुझसे. Use आप or तुम and derivatives. 
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

    // Snapshot before
    const snapBefore = ctx.lessonActor.getSnapshot();
    
    ctx.lessonActor.send({ type: 'ANSWER', correctAnswer, studentAnswer });

    // Snapshot after
    const snapAfter = ctx.lessonActor.getSnapshot();

    // Update's phoneme's score
    const averageScore = await this.userPhonemeScoreService.calculateAverageScore(ctx.userId);

    // Mark correct letters as correct
    const correctLetters = getCorrectLetters(ctx.lessonActor) ?? [];
    for (const correctLetter of correctLetters) {
      const phoneme = await this.phonemesService.findByLetter(correctLetter);
      if (!phoneme) continue;

      await this.userPhonemeScoreService.updateScore(
        ctx.userId,
        phoneme.id,
        true,
        averageScore,
      );
    }
    // Mark incorrect letters as incorrect
    if (previousState === 'image') {
      const wrongLetter = getWrongCharacters(ctx.lessonActor)[0];
      if (!wrongLetter) return;
      const phoneme = await this.phonemesService.findByLetter(wrongLetter);
      if (!phoneme) return;
      const score = await this.userPhonemeScoreService.findScoreForUserAndPhoneme(ctx.userId, phoneme.id);
      if (score && Number(score.value) > -5) {
        await this.userPhonemeScoreService.updateScore(
          ctx.userId,
          phoneme.id,
          false,
          averageScore,
        );
      }
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
    if (!secondLatestUserEvent) {
      await this.userPhonemeScoreService.assignInitialPhonemesWeights(userId);
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
    const recentUsed = (await this.miniLessonsService.findAllWordsByUserIdAndLocale(
      userId,
      locale,
    )).slice(-5);

    const scores = await this.userPhonemeScoreService.findAllForUser(userId);
    const scoreByPhonemeId = new Map<number, number>();
    for (const score of scores) {
      const value = score.value === null ? 1 : parseFloat(score.value);
      scoreByPhonemeId.set(score.phonemeId, value);
    }

    // calculate the average score
    const averageScore = await this.userPhonemeScoreService.calculateAverageScore(userId);

    const wordScores: Array<{ word: string; score: number }> = [];
    for (const word of this.wordData) {
      let wordScore = 0;
      for (const phoneme of word.phonemes) {
        wordScore += (scoreByPhonemeId?.get(phoneme.id) ?? 0) - averageScore;
      }
      wordScores.push({ word: word.word, score: wordScore });
    }

    // words ordered from lowest score to highest score.
    wordScores.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return Math.random() - 0.5;
    });
    const targetWordLength = await this.targetWordLength(userId, locale);
    for (const word of wordScores) {
      if (recentUsed.includes(word.word)) continue; // skip recently used words
      if (word.word.length <= Math.floor(targetWordLength)) return word.word;;
    }
    throw new Error('No word found. This should not have happened.');
  }

  @LogMethod()
  private async targetWordLength(
    userId: number,
    locale: string,
  ): Promise<number> {
    const allLessons = (await this.miniLessonsService.findMostRecentNByUserId(
      userId,
      undefined,
      locale,
    )).reverse();
    let lessonWord = '';
    let counter = 1;
    let allowedWordLength = 2;
    for (const lesson of allLessons) {
      if (lessonWord === lesson.word) {
        counter++;
      } else {
        switch (counter) {
          case 2:
            allowedWordLength += 0.5;
            break;
          case 3:
            allowedWordLength += 0.25;
            break;
          case 4:
            allowedWordLength += 0;
            break;
          case 5:
            allowedWordLength += -0.25;
            break;
          default:
            allowedWordLength += -0.5;
            break;
        }
        lessonWord = lesson.word;
        counter = 1;
      }
    }
    //Make sure allowedWordLength is never less than two
    allowedWordLength = Math.max(allowedWordLength, 2)
    return allowedWordLength;
  }    
}
