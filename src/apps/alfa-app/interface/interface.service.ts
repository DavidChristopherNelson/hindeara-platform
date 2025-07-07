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
import * as DL from 'talisman/metrics/damerau-levenshtein';

const damerauLevenshtein: (a: string, b: string) => number =
  (DL as unknown as (a: string, b: string) => number) ||
  (DL as { default: (a: string, b: string) => number }).default;

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
    const answerStatus = await this.evaluateAnswer(ctx);
    ctx.lessonActor.send(answerStatus);

    // Generate return data
    const state = ctx.lessonActor.getSnapshot().value;
    const word: string = getWord(ctx.lessonActor);
    const letter: string = word[getIndex(ctx.lessonActor)];
    const phoneme = await this.phonemesService.findByLetter(letter);
    if (!phoneme) throw new Error('Unable to find phoneme.');
    const picture: string = phoneme.example_image;
    const uiData: UiDataDto = {
      word,
      letter,
      picture,
      state,
      transcript: ctx.transcript,
    };

    const recording = await this.chatgptService.sendMessage({
      userPrompt: `
        For context this was the previous question that the student was asked: ${ctx.transcript}. 
        And this is the student's previous response: ${ctx.transcript}. 
        The student's previous response is ${JSON.stringify(answerStatus)}.
        ${getPrompt(ctx.lessonActor)}
        Please generate a unique response.
        ${await this.giveHint(ctx.lessonActor)}
        Your response must only contain the actual words you want to communicate to the student **and must not include any emojis or emoticons**.
        Your response must be less than 15 words. 
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

    const target = await this.getAnswer(ctx.lessonActor);
    const studentAnswer = ctx.transcript ?? '';

    /* ---------- local fuzzy pass for single letters ---------- */
    if (this.isLooseMatch(target, studentAnswer)) {
      return { type: 'CORRECT_ANSWER' };
    }
    const prompt = `
      Target token: "${target}".
      Student's answer: "${studentAnswer}".
      Is the student's answer correct?
      `;
    const answer = await this.chatgptService.sendMessage({
      userPrompt: prompt,
      roleContent:
        "A student's answer is correct if it contains the exact target token \
        or only differs from the target token by a little bit.",
      model: 'gpt-4o',
      tool: 'boolean',
      locale: ctx.locale,
    });
    return answer ? { type: 'CORRECT_ANSWER' } : { type: 'INCORRECT_ANSWER' };
  }

  private cleanForCompare(str: string): string {
    return str
      .normalize('NFC')
      .replace(/[^\p{L}\p{M}]+/gu, '') // drop punctuation/space
      .toLowerCase();
  }

  @LogMethod()
  private isLooseMatch(target: string, student: string): boolean {
    const t = this.cleanForCompare(target);
    const s = this.cleanForCompare(student);

    // ──────────────────────────────────────────────────────────────
    // 1. “obvious” positives → exact, prefix, whole-cluster contain
    // ──────────────────────────────────────────────────────────────
    const obvious =
      s === t || // exact
      s.startsWith(t) || // prefix (e.g. क  →  कल, कब…)
      new RegExp(`\\b${t}\\b`, 'u').test(s); // isolated cluster

    if (t.length === 1) {
      // Single grapheme target: ONLY accept the obvious matches.
      return obvious;
    }

    // ──────────────────────────────────────────────────────────────
    // 2. Multi-letter target → allow one Damerau-Levenshtein edit
    //    e.g. कलम  →  कलाम  (insertion of ‘ा’)
    // ──────────────────────────────────────────────────────────────

    return s === t;
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
