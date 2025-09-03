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
import { Repository, MoreThan, LessThan } from 'typeorm';
import { MiniLesson } from 'src/apps/alfa-app/mini-lessons/entities/mini-lesson.entity';
import { Snapshot } from 'xstate';

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
  ) {}

  @LogMethod()
  async processUserInput(
    phoneNumber: string,
    recordingBase64: string,
    locale: string,
    textInput?: string,
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
    const settled = await Promise.allSettled([
      this.google.transcribeAudio(audio, locale),
      this.sarvam.transcribeAudio(audio, locale),
      this.reverie.transcribeAudio(audio, locale),
      this.azure.transcribeAudio(audio, locale),
    ]);

    const transcripts: string[] = [];
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value != null) {
        transcripts.push(String(r.value));
      }
    }
    return transcripts.join(' ');
  }

  @LogMethod()
  async analyzeData(): Promise<AnalyzeDataResponseDto> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUserEvents = await this.userEventsService.findAll({ since });

    const items: AnalyzeDataItemDto[] = [];
    const userNameCache = new Map<number, string>();

    const isRecord = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null;
    const hasContext = (v: unknown): v is { context: unknown } =>
      isRecord(v) && 'context' in v;
    const getNullableBoolean = (v: unknown): boolean | null =>
      typeof v === 'boolean' ? v : null;
    const getNullableString = (v: unknown): string | null =>
      typeof v === 'string' ? v : null;

    for (const userEvent of recentUserEvents) {
      const userId = userEvent.userId;
      const userEventCreatedAt = userEvent.event_createdAt;

      // TODO: Bad Code! Write a mini-lesson serice method instead of exposing the mini-lesson repository directly.
      const miniLesson = await this.miniLessonRepository.findOne({
        where: {
          userId,
          createdAt: MoreThan(userEventCreatedAt),
        },
        order: { createdAt: 'ASC' },
      });

      // TODO: Bad Code! Write a appEvent serice method instead of exposing the appEvent repository directly.
      const appEvent = await this.appEventRepository.findOne({
        where: {
          user: { id: userId },
          createdAt: LessThan(userEventCreatedAt),
        },
        order: { createdAt: 'DESC' },
        select: { id: true, createdAt: true, recording: true },
      });

      console.log('X---------------------------------X');
      console.log('appEvent?.recording: ' + appEvent?.recording);
      console.log('X---------------------------------X');


      const snapshotUnknown: unknown = (miniLesson?.state ?? null) as unknown;
      const contextUnknown: unknown = hasContext(snapshotUnknown)
        ? (snapshotUnknown as Snapshot<unknown>).context
        : null;

      // get user name with simple cache
      let name = userNameCache.get(userId);
      if (!name) {
        const user = await this.usersService.findOne(userId);
        name = user?.name ?? '';
        userNameCache.set(userId, name);
      }

      items.push({
        appTranscript: appEvent?.recording ?? '',
        audioBase64: Buffer.isBuffer(userEvent.event_recording)
          ? userEvent.event_recording.toString('base64')
          : '',
        transcript: userEvent.event_transcription ?? null,
        answerStatus: isRecord(contextUnknown)
          ? getNullableBoolean(contextUnknown['previousAnswerStatus'])
          : null,
        correctAnswer: isRecord(contextUnknown)
          ? getNullableString(contextUnknown['previousCorrectAnswer'])
          : null,
        studentAnswer: isRecord(contextUnknown)
          ? getNullableString(contextUnknown['previousStudentAnswer'])
          : null,
        userId,
        name,
        userEventCreatedAt,
      });
    }

    return { items };
  }
}
