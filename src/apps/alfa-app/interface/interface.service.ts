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

    // Update's phoneme's score
    // Mark correct letters as correct
    const correctLetters = getCorrectLetters(ctx.lessonActor) ?? [];
    for (const correctLetter of correctLetters) {
      const phoneme = await this.phonemesService.findByLetter(correctLetter);
      if (!phoneme) continue;

      await this.userPhonemeScoreService.updateScore(
        ctx.userId,
        phoneme.id,
        true,
      );
    }
    // Mark incorrect letters as incorrect
    if (previousState === 'image') {
      const wrongLetter = getWrongCharacters(ctx.lessonActor)[0];
      if (!wrongLetter) return;
      const phoneme = await this.phonemesService.findByLetter(wrongLetter);
      if (!phoneme) return;
      await this.userPhonemeScoreService.updateScore(
        ctx.userId,
        phoneme.id,
        false,
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
    const usedWords =
      await this.miniLessonsService.findAllWordsByUserIdAndLocale(
        userId,
        locale,
      );
    const recentUsed = usedWords.slice(-5);

    const scoreRows = await this.userPhonemeScoreService.findAllForUser(userId);
    const scoreByPhonemeId = new Map<number, number>();
    for (const row of scoreRows) {
      const n = row.value === null ? 0 : parseFloat(row.value);
      scoreByPhonemeId.set(row.phonemeId, Number.isFinite(n) ? n : 0);
    }

    const wordScores: Array<{ word: string; score: number }> = [];
    for (const word of this.wordData) {
      let wordScore = 0;
      for (const phoneme of word.phonemes) {
        wordScore += scoreByPhonemeId.get(phoneme.id) ?? 0;
      }
      wordScores.push({ word: word.word, score: wordScore });
    }

    // words ordered from lowest score to highest score.
    wordScores.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return Math.random() - 0.5;
    });
    const targetLen = await this.calculateWordLength(userId, locale);
    for (const word of wordScores) {
      if (recentUsed.includes(word.word)) continue; // skip recently used words
      if (word.word.length !== targetLen) continue;
      return word.word;
    }
    throw new Error('No word found. This should not have happened.');
  }

  private readonly wordData: ReadonlyArray<WordEntry> =
    wordDataJson as WordEntry[];

  @LogMethod()
  private async calculateWordLength(
    userId: number,
    locale: string,
  ): Promise<number> {
    const recentLessons = await this.miniLessonsService.findMostRecentNByUserId(
      userId,
      20,
      locale,
    );
    console.log('recentLessons: ', recentLessons);
    const mostRecentLessons = recentLessons.slice(0, 5);
    console.log('mostRecentLessons: ', mostRecentLessons);
    const recentLessonUniqueWords = [
      ...new Set(recentLessons.map((lesson) => lesson.word)),
    ];
    console.log('recentLessonUniqueWords: ', recentLessonUniqueWords);
    const mostRecentLessonUniqueWords = [
      ...new Set(mostRecentLessons.map((lesson) => lesson.word)),
    ];
    console.log('mostRecentLessonUniqueWords: ', mostRecentLessonUniqueWords);

    // Start the student with a word length of 2 if they have done less than 5 lessons
    if (recentLessons.length < 5) return 2;

    // Increment the word length if the student has covered 3 or more unique words in the last 5 lessons
    if (mostRecentLessonUniqueWords.length >= 3) {
      if (
        mostRecentLessonUniqueWords.every(
          (w) => w.length === mostRecentLessonUniqueWords[0].length,
        )
      ) {
        return Math.min(mostRecentLessonUniqueWords[0].length + 1, 4);
      }
    }

    // Decrement the word length if the student has covered 3 or less unique words in the last 20 lessons
    if (recentLessonUniqueWords.length <= 3) {
      return Math.max(recentLessonUniqueWords[0].length - 1, 2);
    }

    // Else don't change the word length
    return recentLessonUniqueWords[0].length;
  }
}
