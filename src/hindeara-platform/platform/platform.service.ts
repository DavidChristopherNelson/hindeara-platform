// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// src/hindeara-platform/platform/platform.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/hindeara-platform/users/users.service';
import {
  UserEventsService,
  UserEventWithIds,
} from 'src/hindeara-platform/user-events/user-events.service';
import {
  AppEventsService,
  AppEventWithIds,
} from 'src/hindeara-platform/app-events/app-events.service';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { AppsService } from '../apps/apps.service';
import { AlfaAppInterfaceService } from 'src/apps/alfa-app/interface/interface.service';
import { CreateAppEventDto } from '../app-events/dto/create-app-event.dto';
import { App } from '../apps/entities/app.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { CreateUserEventDto } from '../user-events/dto/create-user-event.dto';
import { UtilsService } from 'src/common/utils.service';
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';
import { SpeechmaticsService } from 'src/integrations/speechmatics/speechmatics.service';
import { GoogleService } from 'src/integrations/google/google.service';
import { DeepgramService } from 'src/integrations/deepgram/deepgram.service';
import { SarvamService } from 'src/integrations/sarvam/sarvam.service';
import { ReverieService } from 'src/integrations/reverie/reverie.service';

interface extractServiceData {
  service: string;
  serviceAnswer: string;
  responseTime: number;
  correctAnswer: string;
  computerAssessment: boolean;
  appEventId: number;
  state: string;
}

/* ───────── constants ───────── */
const CONSONANT_SET = new Set(
  'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहabcdefghijklmnopqrstuvwxyz'.split(''),
);

const VOWEL_MATRA_SET = new Set(
  'ा ि ी ु ू ृ ॄ े ै ो ौ ॢ ॣ'.replace(/\s+/g, '').split(''),
);

const LONG_A = 'ा';

const FAMILIES: string[][] = [
  ['क', 'ख', 'क़', 'ख़'],
  ['ग', 'घ', 'ग़'],
  ['च', 'छ'],
  ['ज', 'झ', 'ज़'],
  ['ट', 'ठ', 'त', 'थ'],
  ['ड', 'ढ', 'द', 'ध'],
  ['प', 'फ', 'फ़'],
  ['ब', 'भ'],
  ['श', 'ष', 'स'],
  ['र', 'ड़', 'ढ़'],
  ['य', 'ए', 'ऐ'],
  ['ओ', 'औ'],
];

const CHARACTER_TO_FAMILY = new Map<string, number>();
FAMILIES.forEach((fam, i) =>
  fam.forEach((ch) => CHARACTER_TO_FAMILY.set(ch, i)),
);
const sameFamily = (a: string, b: string) =>
  CHARACTER_TO_FAMILY.get(a) === CHARACTER_TO_FAMILY.get(b);

type MarkArgs = { correctAnswer: string; studentAnswer: string };

/* ───────── utility class ───────── */
class EvaluateAnswer {
  /* helpers */
  private static isConsonant = (ch: string) => CONSONANT_SET.has(ch);

  private static consonantCount(word: string): number {
    let c = 0;
    for (const ch of [...word.normalize('NFC')]) {
      if (this.isConsonant(ch)) c++;
    }
    return c;
  }

  private static clean(str: string): string {
    return str
      .normalize('NFC')
      .trim()
      .replace(/[^\p{L}\p{M}]/gu, '')
      .toLocaleLowerCase();
  }

  /* public APIs --------------------------------------------------- */

  @LogMethod()
  static markWord({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    const cleanedCorrectAnswer = this.clean(correctAnswer);
    const splitStudentAnswer = studentAnswer.split(/\s+/);

    const isEquivalent = (a: string, b: string) => a === b || sameFamily(a, b);

    return splitStudentAnswer.some((w) => {
      const cleanedW = this.clean(w);
      if (cleanedW === cleanedCorrectAnswer) return true;

      // Schwa deletion: ignore trailing long ā (ा) in correctAnswer
      if (
        cleanedCorrectAnswer.endsWith(LONG_A) &&
        cleanedW === cleanedCorrectAnswer.slice(0, -1)
      ) {
        return true;
      }

      // Match words that have characters in the same family in the same position.
      if (cleanedW.length == cleanedCorrectAnswer.length) {
        for (let i = 0; i < cleanedW.length; i++) {
          if (!isEquivalent(cleanedW[i], cleanedCorrectAnswer[i])) return false;
        }
        return true;
      }

      return false;
    });
  }

  /* alias */
  @LogMethod()
  static markImage({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    return this.markWord({ correctAnswer, studentAnswer });
  }

  @LogMethod()
  static markLetter({ correctAnswer, studentAnswer }: MarkArgs): boolean {
    const cleanedCorrectAnswer = this.clean(correctAnswer);
    const words = studentAnswer.trim().split(/\s+/);
    const cCount = this.consonantCount(cleanedCorrectAnswer);

    return words.some((w) => {
      const cleaned = this.clean(w);
      if (cCount === 1) {
        return this.markPhoneme(cleanedCorrectAnswer, cleaned);
      } else if (cCount === 2) {
        return this.markConjunct(cleanedCorrectAnswer, cleaned);
      } else {
        return false;
      }
    });
  }

  @LogMethod()
  private static markPhoneme(correctAnswer: string, word: string): boolean {
    if (!word || !correctAnswer) return false;
    if (word === correctAnswer) return true;

    if (sameFamily(word[0], correctAnswer[0])) {
      if (word.slice(1) === correctAnswer.slice(1)) return true;
      if (word.slice(1) === LONG_A && correctAnswer.slice(1) === '')
        return true;
    }
    return false;
  }

  @LogMethod()
  private static markConjunct(correctAnswer: string, word: string): boolean {
    return word === correctAnswer;
  }
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userEventsService: UserEventsService,
    private readonly appEventsService: AppEventsService,
    private readonly appsService: AppsService,
    private readonly alfaAppInterface: AlfaAppInterfaceService,
    private readonly utilsService: UtilsService,
    private readonly chatgpt: ChatGPTService,
    private readonly speechmatics: SpeechmaticsService,
    private readonly google: GoogleService,
    private readonly deepgram: DeepgramService,
    private readonly sarvam: SarvamService,
    private readonly reverie: ReverieService,
  ) {}

  @LogMethod()
  async processUserInput(
    phoneNumber: string,
    recordingBase64: string,
    locale: string,
  ): Promise<AppEvent> {
    const [user, transcription] = await this.dataProcessing(
      phoneNumber,
      recordingBase64,
      locale,
    );

    const createUserEventDto: CreateUserEventDto = {
      recording: recordingBase64,
      locale,
      transcription,
    };
    await this.userEventsService.create(createUserEventDto, user);

    const validAppEvent = await this.utilsService.findMostRecentValidAppEvent({
      user,
    });
    const currentApp =
      validAppEvent?.app ?? (await this.appsService.chooseNewApp());
    const createAppEventDto: CreateAppEventDto = await this.runApp(
      user,
      currentApp,
    );

    return this.appEventsService.create(
      createAppEventDto,
      locale,
      user,
      currentApp,
    );
  }

  @LogMethod()
  async runApp(user: User, app: App): Promise<CreateAppEventDto> {
    switch (app.http_path) {
      case 'alfa-app': {
        const dto = await this.alfaAppInterface.run(user.id);
        if (!dto) throw new Error(`App not found: ${app.http_path}`);
        return dto;
      }
      default:
        throw new Error(`App not found: ${app.http_path}`);
    }
  }

  @LogMethod()
  private async dataProcessing(
    phoneNumber: string,
    recordingBase64: string,
    locale: string,
  ): Promise<[User, string]> {
    // Get the user from the phone number
    const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(
        `No user corresponds with this phone number: ${phoneNumber}.`,
      );
    }

    // Process the recording to get the transcription
    const audioBuffer = Buffer.from(recordingBase64, 'base64');
    if (audioBuffer.length === 0) return [user, ''];

    // Measure execution time for all transcription services
    const gptStartTime = Date.now();
    const smStartTime = Date.now();
    const googleStartTime = Date.now();
    const deepgramStartTime = Date.now();
    const sarvamStartTime = Date.now();
    const reverieStartTime = Date.now();

    const [
      gptRes,
      smRes,
      googleRes,
      deepgramRes,
      sarvamRes,
      reverieRes,
    ] = await Promise.allSettled([
      this.chatgpt.transcribeAudio(audioBuffer, locale).then((result) => {
        const gptEndTime = Date.now();
        const gptDuration = (gptEndTime - gptStartTime) / 1000; // seconds
        return { result, duration: gptDuration };
      }),
      this.speechmatics.transcribeAudio(audioBuffer, locale).then((result) => {
        const smEndTime = Date.now();
        const smDuration = (smEndTime - smStartTime) / 1000; // seconds
        return { result, duration: smDuration };
      }),
      this.google.transcribeAudio(audioBuffer, locale).then((result) => {
        const googleEndTime = Date.now();
        const googleDuration = (googleEndTime - googleStartTime) / 1000; // seconds
        return { result, duration: googleDuration };
      }),
      this.deepgram.transcribeAudio(audioBuffer, locale).then((result) => {
        const deepgramEndTime = Date.now();
        const deepgramDuration = (deepgramEndTime - deepgramStartTime) / 1000; // seconds
        return { result, duration: deepgramDuration };
      }),
      this.sarvam.transcribeAudio(audioBuffer, locale).then((result) => {
        const sarvamEndTime = Date.now();
        const sarvamDuration = (sarvamEndTime - sarvamStartTime) / 1000; // seconds
        return { result, duration: sarvamDuration };
      }),
      this.reverie.transcribeAudio(audioBuffer, locale).then((result) => {
        const reverieEndTime = Date.now();
        const reverieDuration = (reverieEndTime - reverieStartTime) / 1000; // seconds
        return { result, duration: reverieDuration };
      }),
    ]);

    const transcriptions: Array<{
      service: string;
      latency: number;
      transcript: string;
    }> = [];

    const pushIfFulfilled = (
      res: PromiseSettledResult<{ result: string; duration: number }>,
      service: string,
    ) => {
      if (res.status === 'fulfilled') {
        transcriptions.push({
          service,
          transcript: res.value.result,
          latency: Number(res.value.duration.toFixed(3)),
        });
      }
    };

    pushIfFulfilled(gptRes, 'GPT');
    pushIfFulfilled(smRes, 'Speechmatics');
    pushIfFulfilled(googleRes, 'Google');
    pushIfFulfilled(deepgramRes, 'Deepgram');
    pushIfFulfilled(sarvamRes, 'Sarvam');
    pushIfFulfilled(reverieRes, 'Reverie');

    const transcription = JSON.stringify(transcriptions);

    // Return data
    return [user, transcription];
  }

  // This analysis code is not written to be maintanable
  // It is a quick and dirty solution to get the data out of the system.
  @LogMethod()
  async analyzeData(): Promise<extractServiceData[]> {
    const userId = 4;
    const appEvents: AppEventWithIds[] = await this.appEventsService.findAll({
      userId,
      locale: 'hi',
    });
    const extractedData: extractServiceData[] = [];
    let counter = 0;
    for (const appEvent of appEvents.slice(1).reverse()) {
      counter = counter + 1;
      const userEvents = await this.userEventsService.findAll({
        userId,
        since: appEvent.event_createdAt,
      });
      const userEvent = userEvents[userEvents.length - 1];
      extractedData.push(...this.analyzeEventPairs(appEvent, userEvent));
    }
    return extractedData;
  }

  @LogMethod()
  private analyzeEventPairs(
    appEvent: AppEventWithIds,
    userEvent: UserEventWithIds,
  ): extractServiceData[] {
    // ── NEW: guard against missing/empty/non‑JSON transcription ──
    const raw = userEvent?.event_transcription;
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
      // nothing to analyze for this userEvent
      return [];
    }

    const extractedServiceData: extractServiceData[] = [];
    const serviceEvents = JSON.parse(userEvent.event_transcription);
    for (const serviceEvent of serviceEvents) {
      extractedServiceData.push(
        this.analyzeServiceEvent(appEvent, serviceEvent),
      );
    }
    return extractedServiceData;
  }

  @LogMethod()
  private analyzeServiceEvent(
    appEvent: AppEventWithIds,
    serviceEvent: string,
  ): extractServiceData[] {
    const serviceAnswer = serviceEvent.transcript;
    const [correctAnswer, computerAssessment] = this.findAndMarkCorrectAnswer(
      serviceAnswer,
      appEvent,
    );
    const state = JSON.parse(appEvent.event_uiData).state;
    return {
      service: serviceEvent.service,
      serviceAnswer: serviceEvent.transcript,
      responseTime: serviceEvent.latency,
      correctAnswer,
      computerAssessment,
      appEventId: appEvent.event_id,
      state,
    };
  }

  @LogMethod()
  private findAndMarkCorrectAnswer(
    serviceAnswer: string,
    appEvent: AppEventWithIds,
  ): [string, boolean] {
    const ui = JSON.parse(appEvent.event_uiData);
    let correctAnswer = '';
    let computerAssessment: boolean;
    switch (ui.state) {
      case 'word':
        correctAnswer = ui.word;
        computerAssessment = EvaluateAnswer.markWord({
          correctAnswer,
          studentAnswer: serviceAnswer,
        });
        break;
      case 'letter':
        correctAnswer = ui.letter;
        computerAssessment = EvaluateAnswer.markLetter({
          correctAnswer,
          studentAnswer: serviceAnswer,
        });
        break;
      case 'image':
        correctAnswer = ui.picture.slice(0, -4);
        computerAssessment = EvaluateAnswer.markImage({
          correctAnswer,
          studentAnswer: serviceAnswer,
        });
        break;
      case 'letterImage':
        correctAnswer = ui.letter;
        computerAssessment = EvaluateAnswer.markLetter({
          correctAnswer,
          studentAnswer: serviceAnswer,
        });
        break;
      default:
        correctAnswer = 'Error: undetectible state';
        computerAssessment = false;
    }

    return [correctAnswer, computerAssessment];
  }
}
