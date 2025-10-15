// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// src/hindeara-platform/platform/platform.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/hindeara-platform/users/users.service';
import { UserEventsService } from 'src/hindeara-platform/user-events/user-events.service';
import { AppEventsService } from 'src/hindeara-platform/app-events/app-events.service';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { AppsService } from '../apps/apps.service';
import { AlfaAppInterfaceService } from 'src/apps/alfa-app/interface/interface.service';
import { CreateAppEventDto } from '../app-events/dto/create-app-event.dto';
import { App } from '../apps/entities/app.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { CreateUserEventDto } from '../user-events/dto/create-user-event.dto';
import { UtilsService } from 'src/common/utils.service';
import { GoogleService } from 'src/integrations/google/google.service';
import { SarvamService } from 'src/integrations/sarvam/sarvam.service';
import { ReverieService } from 'src/integrations/reverie/reverie.service';
import { AzureSttService } from 'src/integrations/azure/azure.service';
import {
  AnalyzeDataItemDto,
  AnalyzeDataResponseDto,
} from './dto/analyze-data-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MiniLesson } from 'src/apps/alfa-app/mini-lessons/entities/mini-lesson.entity';
import { Snapshot } from 'xstate';
import { UserPhonemeScoreService } from 'src/apps/alfa-app/score/score.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userEventsService: UserEventsService,
    private readonly appEventsService: AppEventsService,
    private readonly appsService: AppsService,
    private readonly alfaAppInterface: AlfaAppInterfaceService,
    private readonly utilsService: UtilsService,
    private readonly google: GoogleService,
    private readonly sarvam: SarvamService,
    private readonly reverie: ReverieService,
    private readonly azure: AzureSttService,
    // TODO: Bad Code! Write a mini-lesson serice method instead of exposing the mini-lesson repository directly.
    @InjectRepository(MiniLesson)
    private readonly miniLessonRepository: Repository<MiniLesson>,
    // TODO: Bad Code! Write a appEvent serice method instead of exposing the appEvent repository directly.
    @InjectRepository(AppEvent)
    private readonly appEventRepository: Repository<AppEvent>,
    private readonly userPhonemeScoreService: UserPhonemeScoreService,
  ) {}

  @LogMethod()
  async processUserInput(
    phoneNumber: string,
    recordingBase64: string,
    locale: string,
    textInput?: string,
    previousRequestReceivedAt?: Date,
    requestSentAt?: Date,
    requestReceivedByBackendAt?: Date,
  ): Promise<AppEvent> {
    const [user, transcription] = await this.dataProcessing(
      phoneNumber,
      recordingBase64,
      locale,
      textInput,
    );

    const createUserEventDto: CreateUserEventDto = {
      recording: recordingBase64,
      locale,
      transcription,
      previousRequestReceivedByFrontendAt: previousRequestReceivedAt,
      requestSentFromFrontendAt: requestSentAt,
      requestReceivedByBackendAt: requestReceivedByBackendAt,
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
    textInput?: string,
  ): Promise<[User, string]> {
    // Get the user from the phone number
    const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(
        `No user corresponds with this phone number: ${phoneNumber}.`,
      );
    }

    // If text input is provided, use it as the transcription
    if (textInput) return [user, textInput];

    // Process the recording to get the transcription
    const audioBuffer = Buffer.from(recordingBase64, 'base64');
    if (audioBuffer.length === 0) return [user, ''];

    const transcription = await this.runSTTEngines(audioBuffer, locale);

    // Return data
    return [user, transcription];
  }

  @LogMethod()
  private async runSTTEngines(audio: Buffer, locale: string): Promise<string> {
    console.log('==============================================================');
    console.log('Running STT engines for locale: ', locale);
    const settled = await Promise.allSettled([
      this.google.transcribeAudio(audio, locale),
      this.sarvam.transcribeAudio(audio, locale),
      this.reverie.transcribeAudio(audio, locale),
      //this.azure.transcribeAudio(audio, locale),
    ]);
    console.log('==============================================================');

    const transcripts: string[] = [];
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value != null) {
        transcripts.push(String(r.value));
      }
    }
    return transcripts.join(' ');
  }

  @LogMethod()
  async analyzeData(phoneNumber?: string, timeWindow?: number): Promise<AnalyzeDataResponseDto> {
    const timeInDays = timeWindow ?? 1;
    const since = new Date(new Date().setHours(0, 0, 0, 0) - timeInDays * 24 * 60 * 60 * 1000);

    // 1. Load events
    const { recentUserEvents, recentAppEvents } = await this.getEvents(phoneNumber, since);

    // 2. Sort chronologically (use the actual timestamp properties present on your projections)
    recentUserEvents.sort((a, b) => new Date(a.event_createdAt ?? a.createdAt).getTime() - new Date(b.event_createdAt ?? b.createdAt).getTime());
    recentAppEvents.sort((a, b) => new Date(a.event_createdAt ?? a.createdAt).getTime() - new Date(b.event_createdAt ?? b.createdAt).getTime());

    // 3. Cache for user info
    const userNameCache = new Map<number, string>();
    const phoneNumberCache = new Map<number, string>();

    // 4. Build items
    const items: AnalyzeDataItemDto[] = [];
    for (let i = 0; i < recentUserEvents.length; i++) {
      const userEvent = recentUserEvents[i];
      const nextUserEvent = recentUserEvents[i + 1];

      const userId = userEvent.userId ?? userEvent.event_userId;

      // preceding app event (latest app event BEFORE the user event)
      const precedingAppEvent = [...recentAppEvents]
        .filter(app => (app.userId ?? app.event_userId) === userId && new Date(app.event_createdAt ?? app.createdAt) < new Date(userEvent.event_createdAt ?? userEvent.createdAt))
        .pop();

      // following app event (earliest app event AFTER the user event)
      const followingAppEvent = recentAppEvents.find(
        app =>
          (app.userId ?? app.event_userId) === userId &&
          new Date(app.event_createdAt ?? app.createdAt) > new Date(userEvent.event_createdAt ?? userEvent.createdAt),
      );

      const { frontendToBackendLatency, sttLatency, tttLatency, backendToFrontendLatency } =
        this.calculateLatencies(userEvent, followingAppEvent, nextUserEvent);

      const { name, phone } = await this.resolveUserInfo(userId, userNameCache, phoneNumberCache);

      items.push(await this.mapToAnalyzeItem(userEvent, precedingAppEvent, name, phone, {
        frontendToBackendLatency,
        sttLatency,
        tttLatency,
        backendToFrontendLatency,
      }));
    }

    // 5. Days with no events
    const missedDays = this.daysWithNoUserEvents(recentUserEvents, timeInDays);

    // 6. User phoneme scores
    let userScore = [];
    let scoreHistory = [];
    if (phoneNumber) {
      const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
      userScore = await this.userPhonemeScoreService.findLatestForUser(user.id);
      userScore = userScore
        .filter(item => /[^\u0000-\u007F]/.test(item.letter))
        .map(({ letter, value }) => ({ letter, value: parseFloat(value) }))
        .sort((a, b) => a.value - b.value);

      scoreHistory = await this.userPhonemeScoreService.findAllUser(user.id);
    }

    return { items: items.reverse(), missedDays, userScore, scoreHistory };
  }

  private async getEvents(phoneNumber: string | undefined, since: Date) {
    if (!phoneNumber) {
      return {
        recentUserEvents: await this.userEventsService.findAll({ since }),
        recentAppEvents: await this.appEventsService.findAll({ since }),
      };
    }

    const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (!user) throw new NotFoundException(`No user found with phone number: ${phoneNumber}`);

    return {
      recentUserEvents: await this.userEventsService.findAll({ since, userId: user.id }),
      recentAppEvents: await this.appEventsService.findAll({ since, userId: user.id }),
    };
  }

  private toMs(d?: Date | string | number): number | undefined {
    if (!d) return undefined;
    const t = new Date(d).getTime();
    return isNaN(t) ? undefined : t;
  }

  private calculateLatencies(userEvent: any, followingAppEvent?: any, nextUserEvent?: any) {
    if (!followingAppEvent) return { frontendToBackendLatency: 0, sttLatency: 0, tttLatency: 0, backendToFrontendLatency: 0 };
    const toMs = (d: any) => (d ? new Date(d).getTime() : undefined);
    const sentFromFrontend    = toMs(userEvent?.event_requestSentFromFrontendAt);
    const receivedByBackend   = toMs(userEvent?.event_requestReceivedByBackendAt);
    const userEventCreated    = toMs(userEvent?.event_createdAt);
    const followingAppCreated = toMs(followingAppEvent?.event_createdAt);
    const nextPrevReceived    = toMs(nextUserEvent?.event_previousRequestReceivedByFrontendAt);
    const frontendToBackendLatency = (receivedByBackend && sentFromFrontend) ? (receivedByBackend - sentFromFrontend) : 0;
    const sttLatency               = (userEventCreated && receivedByBackend) ? (userEventCreated - receivedByBackend) : 0;
    const tttLatency               = (followingAppCreated && userEventCreated) ? (followingAppCreated - userEventCreated) : 0;
    const backendToFrontendLatency = (nextPrevReceived && followingAppCreated) ? (nextPrevReceived - followingAppCreated) : 0;
    return { frontendToBackendLatency, sttLatency, tttLatency, backendToFrontendLatency };
  }

  private async resolveUserInfo(
    userId: number,
    nameCache: Map<number, string>,
    phoneCache: Map<number, string>,
  ) {
    let name = nameCache.get(userId);
    let phone = phoneCache.get(userId);

    if (!name || !phone) {
      const user = await this.usersService.findOne(userId);
      name = user?.name ?? '';
      phone = user?.phoneNumber ?? '';
      nameCache.set(userId, name);
      phoneCache.set(userId, phone);
    }

    return { name, phone };
  }

  private async mapToAnalyzeItem(
    userEvent: any,
    preceedingAppEvent: any | undefined,
    name: string,
    phoneNumber: string,
    latencies: { frontendToBackendLatency: number; sttLatency: number; tttLatency: number; backendToFrontendLatency: number },
  ): Promise<AnalyzeDataItemDto> {
    const userId = userEvent.userId ?? userEvent.event_userId;
    const userEventCreatedAt = userEvent.event_createdAt ?? userEvent.createdAt;

    const snapshotUnknown: unknown = (await this.miniLessonRepository.findOne({
      where: { userId, createdAt: MoreThan(userEventCreatedAt) },
      order: { createdAt: 'ASC' },
    }))?.state ?? null;

    const contextUnknown =
      typeof snapshotUnknown === 'object' && snapshotUnknown && 'context' in snapshotUnknown
        ? (snapshotUnknown as Snapshot<unknown>).context
        : null;

    const getNullable = <T>(v: unknown, type: 'string' | 'boolean'): T | null =>
      typeof v === type ? (v as T) : null;

    return {
      appTranscript: preceedingAppEvent?.recording ?? '',
      audioBase64: Buffer.isBuffer(userEvent.event_recording)
        ? userEvent.event_recording.toString('base64')
        : '',
      transcript: userEvent.event_transcription ?? null,
      answerStatus: getNullable<boolean>(contextUnknown?.['previousAnswerStatus'], 'boolean'),
      correctAnswer: getNullable<string>(contextUnknown?.['previousCorrectAnswer'], 'string'),
      studentAnswer: getNullable<string>(contextUnknown?.['previousStudentAnswer'], 'string'),
      userId,
      name,
      phoneNumber,
      userEventCreatedAt,
      ...latencies,
    };
  }

  private daysWithNoUserEvents(userEvents: any[], timeInDays: number): number {
    let midnight: Date = new Date(new Date().setHours(0, 0, 0, 0));
    let previousMidnight: Date = new Date(midnight.getTime() - 24 * 60 * 60 * 1000);
    let missedDays = 0;
    for (let i = 0; i < timeInDays; i++) {
      let activeDay = false;
      for (const userEvent of userEvents) {
        const createdAt = new Date(userEvent.event_createdAt ?? userEvent.createdAt);
        if (createdAt > previousMidnight && createdAt <= midnight) {
          activeDay = true;
          break;
        }
      }
      if (!activeDay) {
        missedDays++;
      }
      midnight = previousMidnight;
      previousMidnight = new Date(previousMidnight.getTime() - 24 * 60 * 60 * 1000);
    }
    return missedDays;
  }
}
