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
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';
import { SpeechmaticsService } from 'src/integrations/speechmatics/speechmatics.service';
import { GoogleService } from 'src/integrations/google/google.service';
import { DeepgramService } from 'src/integrations/deepgram/deepgram.service';
import { SarvamService } from 'src/integrations/sarvam/sarvam.service';

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
    const neuralspaceStartTime = Date.now();
    const sarvamStartTime = Date.now();

    const [gptRes, smRes, googleRes, deepgramRes, sarvamRes] =
      await Promise.allSettled([
        this.chatgpt.transcribeAudio(audioBuffer, locale).then((result) => {
          const gptEndTime = Date.now();
          const gptDuration = (gptEndTime - gptStartTime) / 1000; // seconds
          return { result, duration: gptDuration };
        }),
        this.speechmatics
          .transcribeAudio(audioBuffer, locale)
          .then((result) => {
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
      ]);

    const gptText =
      gptRes.status === 'fulfilled'
        ? `GTP: ${gptRes.value.result} ${gptRes.value.duration.toFixed(3)}s`
        : '';

    let smText = '';
    if (smRes.status === 'fulfilled') {
      smText = `Speechmatics: ${smRes.value.result} ${smRes.value.duration.toFixed(3)}s`;
    } else if (smRes.status === 'rejected') {
      smText = 'Speechmatics failed';
    }

    let googleText = '';
    if (googleRes.status === 'fulfilled') {
      googleText = `Google: ${googleRes.value.result} ${googleRes.value.duration.toFixed(3)}s`;
    } else if (googleRes.status === 'rejected') {
      googleText = 'Google failed';
    }

    let deepgramText = '';
    if (deepgramRes.status === 'fulfilled') {
      deepgramText = `Deepgram: ${deepgramRes.value.result} ${deepgramRes.value.duration.toFixed(3)}s`;
    } else if (deepgramRes.status === 'rejected') {
      deepgramText = 'Deepgram failed';
    }

    let sarvamText = '';
    if (sarvamRes.status === 'fulfilled') {
      sarvamText = `Sarvam: ${sarvamRes.value.result} ${sarvamRes.value.duration.toFixed(3)}s`;
    } else if (sarvamRes.status === 'rejected') {
      sarvamText = 'Sarvam failed';
    }

    const transcription = [
      gptText,
      smText,
      googleText,
      deepgramText,
      sarvamText,
    ]
      .filter(Boolean)
      .join('\n')
      .trim();

    // Return data
    return [user, transcription];
  }
}
