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
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';
import { SpeechmaticsService } from 'src/integrations/speechmatics/speechmatics.service';
import { GoogleService } from 'src/integrations/google/google.service';
import { DeepgramService } from 'src/integrations/deepgram/deepgram.service';
import { SarvamService } from 'src/integrations/sarvam/sarvam.service';
import { ReverieService } from 'src/integrations/reverie/reverie.service';
import { AzureSttService } from 'src/integrations/azure/azure.service';

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
    private readonly azure: AzureSttService,
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

    const transcription = await this.runSTTEngines(audioBuffer, locale);

    // Return data
    return [user, transcription];
  }

  @LogMethod()
  private async runSTTEngines(audio: Buffer, locale: string): Promise<string> {
    const settled = await Promise.allSettled([
      this.chatgpt.transcribeAudio(audio, locale),
      this.speechmatics.transcribeAudio(audio, locale),
      this.google.transcribeAudio(audio, locale),
      this.deepgram.transcribeAudio(audio, locale),
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
}
