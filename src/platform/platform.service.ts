import { Injectable } from '@nestjs/common';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { UserEventsService } from 'src/user-events/user-events.service';
import { Builder } from 'src/app-events/dto/buildDto';
import { AppEventsService } from 'src/app-events/app-events.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly userEventsService: UserEventsService,
    private readonly builder: Builder,
    private readonly appEventsService: AppEventsService,
  ) {}

  async processUserInput(
    userId: number,
    recording: string,
  ): Promise<ProcessUserInputResponseDto> {
    const createUserEventDto = { userId: userId, recording: recording };
    const userEvent = await this.userEventsService.create(createUserEventDto);
    const createAppEventDto = await this.builder.createDtoFromUserId(userId);
    const appEvent = await this.appEventsService.create(createAppEventDto);
    const response = new ProcessUserInputResponseDto();
    response.recording = 'Hello!!!';
    return response;
  }
}
