import { Injectable } from '@nestjs/common';
import { ProcessUserInputResponseDto } from './dto/process-user-input-response.dto';
import { UserEventsService } from 'src/user-events/user-events.service';

@Injectable()
export class PlatformService {
  constructor(private readonly userEventsService: UserEventsService) {}

  async processUserInput(
    userId: number,
    recording: string,
  ): Promise<ProcessUserInputResponseDto> {
    const createUserEventDto = { userId: userId, recording: recording };
    // TODO: userEventsController.create( createUserEventDto)
    await this.userEventsService.create(createUserEventDto);
    // TODO: createAppEventDto
    // TODO: appEventService.create(createAppEventDto)
    const response = new ProcessUserInputResponseDto();
    response.recording = 'Hello!!!';
    return response;
  }
}
