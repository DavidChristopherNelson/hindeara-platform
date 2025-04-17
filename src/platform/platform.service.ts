import { Injectable } from '@nestjs/common';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { UserEventsService } from 'src/user-events/user-events.service';
import { Builder } from 'src/app-events/dto/buildDto';

@Injectable()
export class PlatformService {
  constructor(
    private readonly userEventsService: UserEventsService,
    private readonly builder: Builder,
  ) {}

  async processUserInput(
    userId: number,
    recording: string,
  ): Promise<ProcessUserInputResponseDto> {
    const createUserEventDto = { userId: userId, recording: recording };
    await this.userEventsService.create(createUserEventDto);
    // TODO: createAppEventDto
    const createAppEventDto = this.builder.createDtoFromUserId(userId);
    // TODO: appEventService.create(createAppEventDto)
    const response = new ProcessUserInputResponseDto();
    response.recording = 'Hello!!!';
    return response;
  }
}
